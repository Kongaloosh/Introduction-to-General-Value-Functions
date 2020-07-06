var td_errs = [];
var predictions = [];
var cumulants = [];

var learning_paused = false;
var speed = 1;

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
var cumulant_idx = 0;
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

var states = ["is moving", "position", "load", "velocity"];
    var this_select_content = '';
    for(var i=0; i < states.length; i++){
        this_select_content += '<option value="' + states[i] + '">' + states[i] + '</option>';
        }
    $("#cumulant").empty().append(this_select_content);

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
          responsive:true,
          // height: 350,
          type: 'heatmap',
          // height: '200',
          animations: {
            enabled: false,
            },
        },
        dataLabels: {
          enabled: false
            },
//        colors: ["#008FFB"],
//        title: {
//            text: 'Weight Vector and Eligibility Traces'
//            },
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
        return return_cumulant.map(x => x/(1/(1-gamma)))
        return return_cumulant
    }else{
        return []
    }
}

function accumulate(){ 
    traces[active_state] = traces[active_state] * gamma * lambda + 1
    
}

function calculate_td_error(){
    v_state = weights[active_state];
    v_state_prime = weights[active_state_next];
    td_error = cumulant + gamma * v_state_prime - v_state;
}

function update_weights(){
    w_last = weights[active_state]
    weights[active_state] += step_size * traces[active_state] * td_error;
}

function make_prediction(){
    prediction = weights[active_state]
}


function td_step(){
    steps += 1;
    calculate_td_error();
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

    cumulant = [hand_moving, position, load, current_vel][cumulant_idx];
    phi_next = new Array(memory).fill(0);
    active_state_next = parseInt(parseInt(position)*10+(Math.min(current_vel+1, 1)))
}

var plot_len = 200

function plot_data(){
    var gamma = document.getElementById("gamma").value
    var return_cumulant = calculate_return(cumulants, gamma)
    var ctx = document.getElementById("graph").getContext('2d');
    ctx.responsive = true;
    var time_steps = Array.from(Array(predictions.length).keys())
    predictions = predictions.slice(-plot_len);
    var prediction_plot = predictions
    var prediction_plot = predictions.map(x => x/(1/(1-gamma)))
    cumulants = cumulants.slice(-plot_len);
    return_cumulant = return_cumulant.slice(-plot_len);
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
                                display: false,
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
    document.getElementById("active_state").innerHTML = "State: " + active_state

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

    document.getElementById("shoulder-pos").innerHTML = "Shoulder position: " + position;
    document.getElementById("shoulder-vel").innerHTML = "Shoulder velocity: " + current_vel;
    document.getElementById("hand-move").innerHTML = "Is Hand Moving: " + hand_moving;


}
// var step_jump = [1,10,50,100,1000]
var step_jump = [0,1,2,3,4,5]
function update_simulation(num_steps){
    num_steps = step_jump[num_steps]
    if (!learning_paused){
        while (num_steps > 0){
            get_data();
            update_state();
            td_step();
            predictions.push(prediction);
            cumulants.push(cumulant);
            plot_data();
            update_html();
            weight_chart();
            num_steps--;
        }
    }
}


setInterval(function(){
    update_simulation(speed)
}, 100);

document.getElementById("play-pause").addEventListener("click", function(){
    learning_paused = !learning_paused
});

document.getElementById("reset").addEventListener("click", function(){
  weights = new Array(memory).fill(0);
  traces = new Array(memory).fill(0);
  steps = 0;
});

document.getElementById("ff").addEventListener("click", function(){
  speed += 1;
  speed = Math.max(1, speed % 5)
});

document.getElementById("step").addEventListener("click", function(){
    if (learning_paused){
            get_data();
            update_state();
            td_step();
            predictions.push(prediction);
            cumulants.push(cumulant);
            plot_data();
            update_html();
            weight_chart();
    }
});

document.getElementById("cumulant").addEventListener("change", function() {
    cumulant_idx = document.getElementById("cumulant").selectedIndex;
    cumulants = [];
});
