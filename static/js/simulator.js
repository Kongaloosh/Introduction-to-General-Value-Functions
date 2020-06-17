var td_errs = [];
var predictions = [];
var cumulants = [];

function plot_data(){
    var ctx = document.getElementById("graph").getContext('2d');
    ctx.responsive = true;
    var time_steps = Array.from(Array(predictions.length).keys())
    console.log(time_steps)
    var myChart = new Chart(ctx,
                    {
                        type: 'line',
                        data: {
                            labels:time_steps,
                            datasets: [{
                                label: 'prediction',
                                data: predictions,
                                borderWidth: 1,
                                // borderColor: 'rgb(235, 255, 236)',
                                // pointBackgroundColor: 'rgb(235, 255, 236)',
                            }]
                        },
                        options: {
                            title: {
                                display: true,
                                position: 'top',
                                text: "Predictions"
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: false,
                                        // fontColor:'rgb(235, 255, 236)',
                                    },
                                    gridLines: {
                                        // color: 'rgb(235, 255, 236, 0.3)',
                                        display: true,
                                  },
                                }],
                                xAxes: [{
                                    ticks: {
                                        // fontColor:'rgb(235, 255, 236)',
                                    },
                                    gridLines: {
                                        // color: 'rgb(235, 255, 236, 0.3)',
                                        display: true,
                                  },
                                }]
                            },
                          pointLabels: {
                            // fontColor: 'white' // labels around the edge like 'Running'
                          },
                          animation: {
                                duration: 0.0
                            }
                        }
                    }
                    );

}


function set_data(result){
    document.getElementById("phi").value = result['phi'];
    document.getElementById("phi_next").value = result['phi_next'];
    document.getElementById("tilings").value = result['tilings'];
    document.getElementById("memory").value = result['memory'];
    document.getElementById("steps").value = result['steps'];
    document.getElementById("normalized_position").value = result['normalized_position'];
    document.getElementById("normalized_load").value = result['normalized_load'];
    document.getElementById("normalized_velocity").value = result['normalized_velocity'];
    document.getElementById("td_error").value = result['td_error'];
    document.getElementById("traces").value = result['traces'];
    document.getElementById("prediction").value = result['prediction'];
    document.getElementById("weights").value = result['weights'];
    document.getElementById("gamma").value = result['gamma'];
    document.getElementById("lambda").value = result['lambda'];
    document.getElementById("step_size").value = result['step_size'];

    var states = ["normalized_position", "normalized_load", "normalized_velocity"];
    var this_select_content = '';
    for(var i=0; i < states.length; i++){
        this_select_content += '<option value="' + states[i] + '">' + states[i] + '</option>';
        }
    console.log(this_select_content)
    $("#cumulant").empty().append(this_select_content);

    document.getElementById("time-step-counter").innerHTML = "Steps: " + result['steps'];
    document.getElementById("td_error_display").innerHTML = result['td_error'];
    document.getElementById("prediction_last").innerHTML = result['prediction'];


//    predictions.push(data['prediction']);
    predictions.push(result['prediction']);
    console.log(result['prediction']);
    plot_data();
}

function get_data(){
    return {
       "phi": document.getElementById("phi").value,
       "phi_next": document.getElementById("phi_next").value,
       "tilings": document.getElementById("tilings").value,
       "memory": document.getElementById("memory").value,
       "steps": document.getElementById("steps").value,
       "normalized_position": document.getElementById("normalized_position").value,
       "normalized_load": document.getElementById("normalized_load").value,
       "normalized_velocity": document.getElementById("normalized_velocity").value,
       "td_error": document.getElementById("td_error").value,
       "traces": document.getElementById("traces").value,
       "prediction": document.getElementById("prediction").value,
       "weights": document.getElementById("weights").value,
       "gamma": document.getElementById("gamma").value,
       "lambda": document.getElementById("lambda").value,
       "step_size": document.getElementById("step_size").value
    }
}

function update_simulation(val) {
    fetch('/simulator', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                "content-type": "application/json"
            },
            body: JSON.stringify(get_data())
        }).then(function (response) {
                return response.json();
            })
            .then(function (result) {
                set_data(result)
            })
        .catch(function(error) {
        // if the server does something funky, we catch it here and keep on truckin'
    });
}

setInterval(function(){
    update_simulation()
}, 1000);