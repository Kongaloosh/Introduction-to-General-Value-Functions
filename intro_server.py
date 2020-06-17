import json
import os
import numpy as np
from pysrc.bento_simulator import get_state
from pysrc.tiles import getTiles as get_tiles
from pysrc import td_learning as td
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, Response, make_response, \
    jsonify
from jinja2 import Environment

# create our little application :)
app = Flask(__name__)
app.config.from_object(__name__)
app.config['STATIC_FOLDER'] = os.getcwd()
cfg = None


@app.route('/simulator')
def simulator():
    # if the request is for a JSON
    if request.headers.get('Accept') == "application/json":
        # parse the JSON from the request which should contain the current state
        data = json.loads(request.data)
        try:
            # fetch the next time-step's values
            data["steps"], data["normalized_position"], data["normalized_load"], data["normalized_velocity"] = \
                get_state(data['steps'],data['normalized_position'],data['normalized_load'], data['normalized_velocity'])
            # update the feature-vector
            data["phi"] = data["phi_next"]
            data["phi_next"] = np.zeros(data['memory'])
            active_features = get_tiles(
                data["tilings"],
                data["memory"],
                [data["normalized_position", data["normalized_load"]]]
            )
            data["phi_next"][active_features] = 1.
            # calculate the temporal-difference error
            data["td_error"] = td.calculate_temporal_difference_error(
                data['weights'], data["normalized_position"], data["gamma"], data["phi_next"], data["phi"]
            )
            # calculate the new eligibility traces
            data["traces"] = td.replace(data["traces"], data["gamma"], data["lambda"] ,data["phi_next"])
            # update the weights to learn from the most recent time-step
            data["weights"] = td.update_weights(data["td_error"],data["traces"],data["weights"],data["step_size"])
            data["prediction"] = np.dot(data["weights"], data["phi_next"])
            return jsonify(
                data
            )
        except KeyError:
            # if the JSON was empty, give the simulator a JSON initialized from scratch to start with
            return jsonify({
                "steps": 0,
                "normalized_position": 0,
                "normalized_load": 0,
                "normalized_velocity": 0,
                "tilings":1,
                "memory": 64,
                "phi_next": np.zeros(64),
                "phi": np.zeros(64),
                "td_error": 0,
                "traces": np.zeros(64),
                "weights": np.zeros(64),
                "prediction": 0,
                "gamma": 0.9,
                "lambda": 0.0,
                "step_size": 0.1,
            })


@app.route('/')
def show_tutorial():
    return render_template('app.html')


if __name__ == "__main__":
    app.run(debug=True)
