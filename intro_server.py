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


@app.route('/simulator', methods=['POST'])
def simulator():
    # if the request is for a JSON
    if "application/json" in request.headers.get('Accept').split(','):
        # parse the JSON from the request which should contain the current state
        data = request.json

        if data == None or data['steps'] == 'null':
            mem = 10012
            return jsonify({
                "steps": 0,
                "normalized_position": 0,
                "normalized_load": 0,
                "normalized_velocity": 0,
                "tilings":2,
                "memory": mem,
                "phi_next": np.zeros(mem).tolist(),
                "phi": np.zeros(mem).tolist(),
                "td_error": 0,
                "traces": np.zeros(mem).tolist(),
                "weights": np.zeros(mem).tolist(),
                "prediction": 0,
                "gamma": 0.9,
                "lambda": 0.9,
                "step_size": 0.01,
            })

        # fetch the next time-step's values
        for key in ["phi", "phi_next", "weights", "traces"]:
            data[key] = np.array([float(i) for i in data[key].split(',')])

        for key in [
                "steps",
                "normalized_position",
                "normalized_load",
                "normalized_velocity",
                "tilings",
                "memory",
                "td_error",
                "prediction",
                "gamma",
                "lambda",
                "step_size"]:
            data[key] = float(data[key])

        update = \
            get_state(data['steps'],data['normalized_position'],data['normalized_load'], data['normalized_velocity'])
        for key, val in zip(["steps","normalized_position","normalized_load","normalized_velocity", "is_moving"], update):
            data[key] = val

        # update the feature-vector
        data["phi"] = data["phi_next"]
        data["phi_next"] = np.zeros(int(data['memory']))

        # active_features = get_tiles(
        #     int(data["tilings"]),
        #     int(data["memory"]),
        #     np.array([data["normalized_position"]*100, data['is_moving'], (data['normalized_velocity']+0.01)/(0.01*2)])
        # )
        active_features =  int(data['is_moving'] + 10*(data['normalized_velocity']+0.05)/(0.05*2) + round(data["normalized_position"]*10000))
        print("state", active_features)
        data["phi_next"][active_features] = 1.
        # calculate the temporal-difference error
        data["td_error"] = td.calculate_temporal_difference_error(
            data['weights'], data["is_moving"], data["gamma"], data["phi_next"], data["phi"]
        )
        # calculate the new eligibility traces
        data["traces"] = td.accumulate(data["traces"], data["gamma"], data["lambda"], data["phi"])

        # update the weights to learn from the most recent time-step
        data["weights"] = td.update_weights(data["td_error"],data["traces"],data["weights"],data["step_size"])
        data["prediction"] = np.dot(data["weights"], data["phi"])

        data['phi']=data["phi"].tolist()
        data["phi_next"]=data["phi_next"].tolist()
        data["weights"]=data["weights"].tolist()
        data["traces"]=data["traces"].tolist()

        return jsonify(
            data
        )


@app.route('/')
def show_tutorial():
    return render_template('app.html')


if __name__ == "__main__":
    app.run(debug=True)
