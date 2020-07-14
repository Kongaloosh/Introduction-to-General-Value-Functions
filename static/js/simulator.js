var td_errs = new Array(200).fill(0);
var predictions = new Array(200).fill(0);
var cumulants = new Array(200).fill(0);

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
var hand_position = 0;
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

var states = ["is hand moving", "shoulder position", "load", "shoulder velocity"];
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
          toolbar: {
            show: false,
          },
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
         plotOptions: {
            heatmap: {
            distributed: true
            }
          }
    };

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

var graph_options = {
          colors: [	 '#999999', '#9932CC', '#ffa500'],
          series: [{
          name: "predictions",
          data: predictions.slice()
            },
            {
                name: 'cumulant',
                data: cumulants,
            },
            {
                name: 'true return',
                data: calculate_return(cumulants, gamma),
            }],
          chart: {
          id: 'realtime',
          height: 350,
          type: 'line',
          animations: {
            enabled: false,
          },
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          },
        },
        xaxis : {
            labels : {
                show:false
            }
        },
//        yaxis : {
//            labels : {
//                show:false
//            }
//        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth'
        },
        markers: {
          size: 0
        },
        legend: {
          show: false
        },
        };

var graph = new ApexCharts(document.querySelector("#graph"), graph_options);
graph.render();


function calculate_return(cumulants, gamma){
    var return_cumulant = cumulants.slice();
    if (return_cumulant.length > 2){
        for (var i = return_cumulant.length - 2; i >= 0; i--) {
            return_cumulant[i] = (return_cumulant[i] + return_cumulant[i+1]*gamma)
        }
        return return_cumulant.map(x => x/(1/(1-gamma)))
        return return_cumulant
    }else{
        return new Array(200).fill(0)
    }
}

function accumulate(){
    for(var i=0; i< traces.length; i++) {
        traces[i] = traces[i] * gamma * lambda
    }
    traces[active_state] += 1
    
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
            if (arr[i] == 1){ƒ
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


    if (position <= 50 && position >= 30){
        hand_moving = 1;
        hand_position = Math.max(0, hand_position + current_vel*2);
    }else{
        hand_moving = 0;
    }

    position += current_vel;

    cumulant = [hand_moving, position, load, current_vel][cumulant_idx];
    phi_next = new Array(memory).fill(0);
    active_state_next = parseInt(parseInt(position)*10+(Math.min(current_vel+1, 1)))
}

var plot_len = 200

async function plot_data(){
    predictions = predictions.slice(-plot_len);
    cumulants = cumulants.slice(-plot_len);
    graph.updateSeries(
         [{
                name: 'predictions',
                data: predictions.map(x => precise(x/(1/(1-gamma)))),
            },
            {
                name: 'cumulant',
                data: cumulants.map(x => precise(x)),
            },
            {
                name: 'true return',
                data: calculate_return(cumulants, gamma).map(x => precise(x)),
            }
            ]
    )
}


async function weight_chart(){
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
  return Number.parseFloat(x).toFixed(2);
}

async function update_html(){
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

}
 var step_jump = [1,2,5,10,20]


function getCurrentRotationFixed(elid ) {
  var el = document.getElementById(elid);
  var st = window.getComputedStyle(el, null);
  var tr = st.getPropertyValue("-webkit-transform") ||
       st.getPropertyValue("-moz-transform") ||
       st.getPropertyValue("-ms-transform") ||
       st.getPropertyValue("-o-transform") ||
       st.getPropertyValue("transform") ||
       "fail...";

  if( tr !== "none") {
    var values = tr.split('(')[1];
      values = values.split(')')[0];
      values = values.split(',');
    var a = values[0];
    var b = values[1];
    var c = values[2];
    var d = values[3];

    var scale = Math.sqrt(a*a + b*b);

    // First option, don't check for negative result
    // Second, check for the negative resulta
    /** /
    var radians = Math.atan2(b, a);
    var angle = Math.round( radians * (180/Math.PI));
    /*/
    var radians = Math.atan2(b, a);
    if ( radians < 0 ) {
      radians += (2 * Math.PI);
    }
    var angle = Math.round( radians * (180/Math.PI));
    /**/

  } else {
    var angle = 0;
  }
  return angle
}



async function update_bento(){
    var increment_degree = 3.6
    var bento = document.getElementById("bento-arm");
    bento.style.transform = "rotate("+ (position*3.6).toString() +"deg)";
    bento.style.transformOrigin = "bottom center"

    var bento = document.getElementById("layer11");
    bento.style.transformOrigin = "100% 100%"
    bento.style.transformBox= "fill-box"
    bento.style.transform = "rotate("+ (-hand_position) + "deg)";



}


function update_simulation(num_steps){
    num_steps = step_jump[num_steps]
    if (!learning_paused){
        while (num_steps > 0){
            get_data();
            update_state();
            td_step();
            predictions.push(prediction);
            cumulants.push(cumulant);
            num_steps--;
        }
        Promise.all([plot_data(), update_html(), weight_chart(), update_bento()]);
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
            num_steps--;
            Promise.all([plot_data(), update_html(), weight_chart()]);
    }
});

document.getElementById("cumulant").addEventListener("change", function() {
    cumulant_idx = document.getElementById("cumulant").selectedIndex;
    cumulants = [];
});
