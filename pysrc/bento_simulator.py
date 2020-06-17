
def get_state(steps, normalized_position, normalized_load, normalized_velocity):
    """Takes the current state of the simulated bento arm and updates it."""
    sim_velocity = 0.01  # simulation velocity
    steps += 1

    # Simulate the shoulder moving back and forth between positions 0 and 1
    # we change the velocity between postive and negative values depending on the position of the joint
    if normalized_position <= 0:
        normalized_velocity = sim_velocity
    elif normalized_position >= 1:
        normalized_velocity = -sim_velocity

    normalized_position += normalized_velocity

    if normalized_position >= 0.5:
        is_moving = 1
    else:
        is_moving = 0

    return steps, normalized_position, normalized_load, normalized_velocity

