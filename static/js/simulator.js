var td_errs = [];
var predictions = [];
var cumulants = [];

var td_error = 0;
var steps = 0;
var memory = 502;
var weights = new Array(memory).fill(0);
var traces = new Array(memory).fill(0);
var phi = new Array(memory).fill(0);
var phi_next = new Array(memory).fill(0);
var gamma = 0.9;
var lambda = 0.9;
var step_size = 0.4;
var prediction = 0;
var v_state = 0;
var v_state_prime = 0;
var active_state = 0;
var active_state_next = 0;

var position = 0;
var load = 0;
var velocity = 1;
var hand_moving = 0;
var cumulant = 0;
var current_vel = 0;
var w_last = 0;


var subindices = [];

for (j = 0; j<= 1; j++){
    for (i = 0; i < 50; i++) {
      subindices.push(i*10+j)
    }
}


document.getElementById("lambda").value = lambda;
document.getElementById("gamma").value = gamma;
document.getElementById("step_size").value = step_size;

var options = {
        series: [
            {
            name: 'Weights',
            data: subindices.map(i => weights[i]),
            },
            {
            name: 'Traces',
            data: subindices.map(i => traces[i]),
            },
        ],
        chart: {
          height: 350,
          type: 'heatmap',
          animations: {
            enabled: false,
            },
        },
        dataLabels: {
          enabled: false
            },
//        colors: ["#008FFB"],
        title: {
            text: 'Weight Vector and Eligibility Traces'
            },
         plotOptions: {
            heatmap: {
            distributed: true
            }
          }
//         plotOptions: {
//            heatmap: {
//              shadeIntensity: 0.5,
//              colorScale: {
//                ranges: [
//                  {
//                    from: 0,
//                    to: 0.005,
//                    name: "low",
//                    color: "#00A100"
//                  },
//                  {
//                    from: 0.005,
//                    to: 0.05,
//                    name: "medium",
//                    color: "#128FD9"
//                  },
//                  {
//                    from: 0.05,
//                    to: 0.5,
//                    name: "high",
//                    color: "#FFB200"
//                  },
//                  {
//                    from: 0.5,
//                    to: 1,
//                    name: "extreme",
//                    color: "#FF0000"
//                  }
//                ]
//              }
//            }
//          },
    };
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

function calculate_return(cumulants, gamma){
    var return_cumulant = cumulants.slice();
    if (return_cumulant.length > 2){
        for (var i = return_cumulant.length - 2; i >= 0; i--) {
            return_cumulant[i] = (return_cumulant[i] + return_cumulant[i+1]*gamma)
        }
//        return return_cumulant.map(x => x/(1/(1-gamma)))
        return return_cumulant
    }else{
        return []
    }
}

function accumulate(){
    for(var i=0; i< traces.length; i++) {
        traces[i] = traces[i] * gamma * lambda + phi[i]
    }
}

function calculate_td_error(){
    v_state = 0;
    v_state_prime = 0;
    for(var i=0; i< weights.length; i++) {
        v_state += weights[i] * phi[i];
        v_state_prime += weights[i] * phi_next[i];
    }
    return cumulant + gamma * v_state_prime - v_state;
}

function update_weights(){
    w_last = weights[active_state]
    for(var i=0; i< weights.length; i++) {
        weights[i] += step_size * traces[i] * td_error;
    }
}

function make_prediction(){
    var v = 0;
    for(var i=0; i< weights.length; i++) {
        v += weights[i] * phi[i];
    }
    prediction = v
}


function td_step(){
    steps += 1;
    td_error = calculate_td_error();
    accumulate();
    update_weights();
    make_prediction()
}

function log_nonzero(arr){
    var count = 0;
    for(var i=0; i< traces.length; i++) {
            if (arr[i] == 1){
                return i
            }
    }
}

function update_state(){
    phi = phi_next;
    active_state = active_state_next;
    if (position >= 50){
        current_vel = -1 * velocity;
    }else if (position <= 0){
        current_vel = velocity;
    }

    position += current_vel;

    if (position >= 35){
        hand_moving = 1;
    }else{
        hand_moving = 0;
    }

    cumulant = hand_moving;
    phi_next = new Array(memory).fill(0);
    active_state_next = parseInt(position*10+(Math.min(current_vel+1, 1)))
    phi_next[active_state_next] = 1;
}

function plot_data(){
    var gamma = document.getElementById("gamma").value
    var return_cumulant = calculate_return(cumulants, gamma)
    var ctx = document.getElementById("graph").getContext('2d');
    ctx.responsive = true;
    var time_steps = Array.from(Array(predictions.length).keys())
    predictions = predictions.slice(-100);
    var prediction_plot = predictions
//    var prediction_plot = predictions.map(x => x/(1/(1-gamma)))
    cumulants = cumulants.slice(-100);
    return_cumulant = return_cumulant.slice(-100);
    var myChart = new Chart(ctx,
                    {
                        type: 'line',
                        data: {
                            labels:time_steps,
                            datasets: [{
                                label: 'prediction',
                                data: prediction_plot,
                                borderWidth: 1,
                                fill: false,
                                // borderColor: 'rgb(235, 255, 236)',
                                // pointBackgroundColor: 'rgb(235, 255, 236)',
                            },
                            {
                                label: 'cumulant',
                                data: cumulants,
                                borderColor: 'rgb(148,0,211)',
                                borderWidth: 1,
                                fill: false

                            },
                            {
                                label: 'true return',
                                data: return_cumulant,
                                borderColor: 'rgb(235, 201, 52)',
                                borderWidth: 1,
                                fill: false,
                            }
                            ]
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


function weight_chart(){
//    chart.updateSeries(weights)
    chart.updateSeries(
        [
            {
            name: 'Weights',
            data: subindices.map(i => weights[i]),
            },
            {
            name: 'Traces',
            data: subindices.map(i => traces[i]),
            },
        ]
        )
}

function get_data(){
    lambda = document.getElementById("lambda").value;
    gamma = document.getElementById("gamma").value
    step_size = document.getElementById("step_size").value;
}

function precise(x) {
  return Number.parseFloat(x).toPrecision(2);
}

function update_html(){
    document.getElementById("time-step-counter").innerHTML = "Steps: " + steps;
    document.getElementById("td-td").innerHTML = precise(td_error);
    document.getElementById("td-cumulant").innerHTML = precise(cumulant);
    document.getElementById("td-gamma").innerHTML = precise(gamma);
    document.getElementById("td-v-next").innerHTML = precise(v_state_prime);
    document.getElementById("td-v").innerHTML = precise(v_state);

    document.getElementById("e-e").innerHTML = precise(traces[active_state])
    document.getElementById("e-gamma").innerHTML = precise(gamma)
    document.getElementById("e-lambda").innerHTML = precise(lambda)
    document.getElementById("e-e2").innerHTML = precise(traces[active_state])

    document.getElementById("w-w").innerHTML = precise(w_last)
    document.getElementById("w-w2").innerHTML = precise(weights[active_state])
    document.getElementById("w-alpha").innerHTML = precise(step_size)
    document.getElementById("w-td").innerHTML = precise(td_error)

}

function update_simulation(){
    get_data();
    update_state();
    td_step();
    predictions.push(prediction);
    cumulants.push(cumulant);
    plot_data();
    update_html();
    weight_chart();
}

//function update_simulation(val) {
//    fetch('/simulator', {
//            method: 'POST',
//            headers: {
//                'Accept': 'application/json',
//                "content-type": "application/json"
//            },
//            body: JSON.stringify(get_data())
//        }).then(function (response) {
//                return response.json();
//            })
//            .then(function (result) {
//                set_data(result)
//            })
//        .catch(function(error) {
//        // if the server does something funky, we catch it here and keep on truckin'
//    });
//}

setInterval(function(){
    update_simulation()
}, 100);