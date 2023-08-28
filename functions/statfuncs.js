const APPROX_WIDTH = 0.0001;
const STOP_SD = 10;

const DENSITY_ITER = 1 / APPROX_WIDTH;


// uses trapezoid approximation
function normcdf(x, width = APPROX_WIDTH, stop_sd = STOP_SD) {
    var sum = (normpdf(x) + normpdf(-stop_sd * 2))/2;
    curr_x = x - width;
    while (curr_x >= -stop_sd) {
        sum += normpdf(curr_x);
        curr_x -= width;
    }
    return sum * width;
} 

function normpdf(x, mu = 0, sd = 1) {
    return 1 / (sd * Math.sqrt(2 * Math.PI) * Math.exp(0.5 * Math.pow((x-mu)/sd, 2)));
}

function normd(mu = 0, sd = 1, iter = DENSITY_ITER, stop_sd = STOP_SD) {
    var y_density = [];
    var x_density = [];
    var width = stop_sd * 2 * sd / iter;
    var center = Math.floor(iter / 2);

    for (var i = 0; i <= iter; i++) {
        x = (i - center) * width;
        x_density.push(x * sd + mu);
        y_density.push(normpdf(x, mu, sd));
    }

    return [x_density, y_density];
}


const CANVAS_OFFSET = 100;
const SCALE = 5;
const LINE_WIDTH = 3 * SCALE;
const H_SCALE = 0.2;
const V_SCALE = 2;
const NULL_COLOR = "#555555";
const ALT_COLOR = "#000000";
const P_COLOR = "#FF0000";
const P_ALPHA = 0.3;

function drawmodels(canvas, test, alt_hyp) {

    var displayWidth = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * SCALE;
    canvas.height = displayHeight * SCALE;

    context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);


    // shade p value
    var dir = (alt_hyp == "lt") ? "left" : ((alt_hyp == "gt") ? "right" : "both");
    fillmodel(canvas, 0, 1, test, dir, P_COLOR, P_ALPHA);

    // draw distributions
    drawmodel(canvas, 0, 1, NULL_COLOR);
    drawmodel(canvas, test, 1, ALT_COLOR);

    // draw axis
    context.lineWidth = LINE_WIDTH/2;
    context.beginPath();
    context.moveTo(0, canvas.height - CANVAS_OFFSET);
    context.lineTo(canvas.width, canvas.height - CANVAS_OFFSET);

    context.stroke();
    context.closePath();
}

function drawmodel(canvas, mean, sd, color) {

    const context = canvas.getContext("2d");
    const density = normd(mean, sd);
    const width = canvas.width;
    const height = canvas.height;


    context.beginPath();

    context.lineWidth = LINE_WIDTH;
    context.strokeStyle = color;

    context.moveTo(0, height - density[1][0] - CANVAS_OFFSET);
    for (var i = 0; i < density[0].length; i++) {
        context.lineTo((width / 2) + (density[0][i] - mean) * H_SCALE * width / 2, height - density[1][i] * V_SCALE * height - CANVAS_OFFSET);
    }

    context.stroke();

    context.closePath();


}

function fillmodel(canvas, mean, sd, from, dir, color, alpha) {
    const context = canvas.getContext("2d");
    const density = normd(mean, sd);
    const width = canvas.width;
    const height = canvas.height;


    context.moveTo(0, height - density[1][0] - CANVAS_OFFSET);

    if (dir == "left") {
        context.beginPath();
        for (var i = 0; i < density[0].length; i++) {
            context.lineTo(width / 2 + density[0][i] * H_SCALE * width / 2, height - density[1][i] * V_SCALE * height - CANVAS_OFFSET);
            if (density[0][i] > from) {
                break;
            }
        }
    } else if (dir == "right") {
        context.beginPath();
        for (var i = density[0].length - 1; i >= 0; i--) {
            context.lineTo(width / 2 + density[0][i] * H_SCALE * width / 2, height - density[1][i] * V_SCALE * height - CANVAS_OFFSET);
            if (density[0][i] < from) {
                break;
            }
        }
    } else {
        if (from < mean) {
            fillmodel(canvas, mean, sd, from, "left", color);
            fillmodel(canvas, mean, sd, mean + (mean - from), "right", color);
        } else {
            fillmodel(canvas, mean, sd, from, "right", color);
            fillmodel(canvas, mean, sd, mean + (mean - from), "left", color);
        }
    }

    context.lineTo(width / 2 + from * H_SCALE * width / 2, height - CANVAS_OFFSET);

    context.globalAlpha = P_ALPHA;
    context.fillStyle = color;
    context.fill();
    context.globalAlpha = 1;
    context.closePath();

}

