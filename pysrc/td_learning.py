"""ƒ
Functions which perform the necessary operations for TD(lambda) learning including TIDBD-based step-size adaptation.
"""

import numpy as np

__author__ = "Alex Kearney"


def replace(traces, gamma, lmbda, phi):
    """Updates traces with replacing"""
    traces = gamma * lmbda * traces * (phi.T == 0.) + (phi.T != 0.) * phi.T
    return traces


def accumulate(traces, gamma, lmbda, phi):
    """Updates traces without replacing
    Args:
        traces: the eligibility traces to asign credit for current observations to previous states.
        gamma: the discounting value for the current update.
        lmbda: the amount by which we decay our elegibility traces.
        phi: binary feature vector representing the current state.
    Returns:
        traces: the eligibility traces to asign credit for current observations to previous states.
    """
    return traces * (gamma * lmbda) + phi.T


def calculate_temporal_difference_error(weights, cumulant, gamma_next, phi_next, phi):
    """Based on given inputs, calculates a TD error
    Args:
        weights: the learned weights of our model.
        cumulant: the currently observed cumulant signal which we are learning to predict.
        gamma_next: the discounting value for the current update.
        phi_next: binary feature vector representing the next state.
        phi: binary feature vector representing the current state.
    Returns:
        td_error: the temporal-difference error for the current observations.
    """
    return cumulant + gamma_next * np.dot(weights, phi_next) - np.dot(weights, phi)


def update_weights(td_error, traces, weights, step_size):
    """Updates the weights given a step-size, traces, and a TD error.
    Args:
        td_error: the temporal-difference error.
        traces: the eligibility traces to asign credit for current observations to previous states.
        weights: the learned weights of our model.
        step_size: the amount by which weight updates are scaled.
    Returns:
        weights: updated weights correcting for current TD error.
    """
    return weights + step_size * traces * td_error


def get_effective_step_size(beta, traces, gamma, phi, phi_next):
    """Returns the effective step-size or the biased estimate of how much an update has reduced the error on a given
    example.

    Args:
        beta: meta-weights which define step-sizes.
        traces: the eligibility traces to asign credit for current observations to previous states.
        gamma: the discounting value for the current update.
        phi: binary feature vector representing the current state.
        phi_next": binary feature vector representing the next state.
    Returns:
        effective step-size: a ratio describing the amount by which the error has been reduced on a given example.
        """
    return np.sum((-1 * (np.exp(beta) * traces)) * gamma * (phi_next - phi).T, axis=1)[:, None]


def update_normalizer_accumulation(normalizer, beta, traces, phi, h, td_error, tau=1. / 1000.):
    """Returns a decaying maximum of meta-weight updates with which updates to meta-weights beta are normalized within
    0-1.

    Args:
        normalizer: the decaying maximum of meta-weight updates.
        beta: meta-weights which define step-sizes.
        traces: the eligibility traces to asign credit for current observations to previous states.
        phi: binary feature vector representing the current state.
        h: trace of meta-weight updates.
        td_error: the temporal-difference error.
        tau: heat value to manage the decay.
    Returns:
        normalizer
    """
    update = np.abs(td_error * h * phi.T)
    return np.maximum(update, normalizer - (1. / tau) * np.exp(beta) * traces * -phi.T * update - normalizer)


def normalize_step_size(step_size, beta, traces, gamma, phi, phi_next):
    """normalizes
    Args:
        step_size: the step-sizes to be normalized.
        beta: meta-weights which define step-sizes.
        traces: the eligibility traces to asign credit for current observations to previous states.
        gamma: the discounting value for the current update.
        phi: binary feature vector representing the current state.
        phi_next": binary feature vector representing the next state.

    Returns:
        beta: normalized meta-weights.
    """
    effective_step_size = get_effective_step_size(beta, traces, gamma, phi, phi_next)
    m = np.maximum(effective_step_size, 1.)
    return step_size / m


def update_meta_weights(beta, phi, meta_step_size, td_error, h, normalizer):
    """Updates meta-weights.
    Args:
        beta: meta-weights which define step-sizes.
        phi: binary feature vector representing the current state.
        meta_step_size: the amount by which we scale updates to meta-weights.
        td_error: the temporal-difference error.
        h: trace of meta-weight updates.
        normalizer: decaying trace of maximum meta-weight updates
    Returns:
        beta: meta-weights which define step-sizes.
    """
    normalizer[normalizer == 0] = 1  # to prevent us from dividing by zero
    return beta + (meta_step_size * td_error * h * phi.T) / normalizer


def calculate_step_size(beta):
    """Given meta-weights beta, returns a step-sizes.
    Args:
        beta: meta-weights.
    Returns:
        step_size: the learned step-size value to scale weight updates with.
    """
    return np.exp(beta)


def update_meta_weight_update_trace(h, traces, phi, td_error, step_size):
    """Updates a vector which contains a decaying trace of meta-weight updates
    Args:
        h: trace of meta-weight updates.
        traces: elegibility traces.
        phi: binary feature vector representing the current state.
        td_error: the currently observed TD error.
        step_size: the amount by which weight updates are scaled.
    Returns:
        h: update of trace of meta-weight updates.
    """
    return (np.ones(traces.shape) - step_size * phi.T * traces).clip(min=0) * h + step_size * td_error * traces
