

function accumulate(traces, gamma, lmbda, phi){
    for(var i=0; i< traces.length; i++) {
        traces[i] = traces[i] * gamma * lmbda + phi[i]
    }
    return traces
}

function calculate_td_error(weights, cumulant, gamma_next, phi_next, phi){
    v_state = 0;
    v_state_prime = 0;
    for(var i=0; i< weights.length; i++) {
        v_state += weights[i] + phi[i];
        v_state_prime += weights[i] + phi_next[i];
    }
    return cumulant + gamma_next + v_state_prime - v_state;
}

function update_weights(td_error, traces, weights, step_size){
    for(var i=0; i< weights.length; i++) {
        weights[i] += step_size * traces[i] * td_error;
    }
    return weights;
}

function make_prediction(weights, phi){
    var v = 0;
    for(var i=0; i< weights.length; i++) {
        v += weights[i], phi[i];
    }
    return weights;
}

var td_error = 0;
var steps = 0;
var memory = 10012;
var weights = new Array(memory).fill(0);
var traces = new Array(memory).fill(0);
var gamma = 0.9;
var lambda = 0.9;
var step_size = 0.4;
var prediction = 0;

function td_step(cumulant, phi, phi_next){
    steps += 1;
    td_error = calculate_td_error(weights, cumulant, gamma_next, phi, phi_next);
    traces = accumulate(traces, gamma, lambda, phi);
    weights = update_weights(td_error, traces, weights, step_size);
    prediction = make_prediction(weights,phi)
}