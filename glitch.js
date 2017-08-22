/*//////////////////////////////////////////

glitch you
ver20120607

//////////////////////////////////////////*/


var canvas;
var context;
var canvas_hidden;
var context_hidden;
var canvas_navi;
var context_navi;

var img_temp;                   //ループごとに更新
var img_current;                //ボタンを押す度に更新。主に使用
var img_original;               //元のまま
var img_binary;                 //glitchに使用
var images = [];
var ratio = 1;                  //画像とcanvasのサイズ比
var loaded = false;
var manual = false;
var navi = {
    x:0,
    y:0,
    w:0,
    h:0
};

var parameters = {
    noise: 0.9,
    simple:50,
    face_x:0,
    face_y:0,
    face_w:0,
    face_h:0,
    type: 'image/jpeg'
};

var Corruptions = {
    'image/jpeg': function() {
        var r = Math.random();
        if(r<0.25){
            return this.replace(/0/g, Math.floor(Math.random() * 10));
        }else if(r<0.5){
            return this.replace(/x/g, Math.floor(Math.random() * 10));
        }else if(r<0.75){
            return this.replace(/0/g, Math.floor(Math.random() * 10));
        }else{
            return this.replace(/t/g, Math.floor(Math.random() * 10));
        }
    },
    'image/gif': function() {
        return this.replace(/x/ig, Math.floor(Math.random() * 10));
    },
    'image/png': function() {
        return this.replace(/0/g, Math.floor(Math.random() * 10));
    },
    'image/bmp': function() {
        return this.replace(/0/g, Math.floor(Math.random() * 10));
    },
    'image/tiff': function() {
        return this.replace(/0/g, Math.floor(Math.random() * 10));
    }
};




//
// initialize
//_________________________

$(function(){
    $("#detecting").hide();
    $("#drawing").hide();

    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas_hidden = document.getElementById("hidden");
    context_hidden = canvas_hidden.getContext("2d");

    canvas_navi = document.getElementById("navi");
    context_navi = canvas_navi.getContext("2d");


    img_original = new Image();
    img_original.src = "sam.png";

    img_current = new Image();
    img_current.src = "sam.png";

    resize();
    $(window).bind("resize",resize);

    $("#button").click(function(){
        if(loaded){
            getForm();
            glitch();
        }else{
            alert('Load your image first');
        }
    });

    $("#save").click(function(){
        window.open( canvas.toDataURL() );
    });

    img_original.onload= function(){
        resize();
        render();
    };

    document.getElementById('files').addEventListener('change', loadImage, false);


    $("#navi").mousedown(function(e){
        context_navi.drawImage(img_current,0,0,img_current.width, img_current.height, 0,0,canvas_navi.width,canvas_navi.height);
        navi.x = e.pageX - $(this).offset().left;
        navi.y = e.pageY - $(this).offset().top;
        manual = true;
    }).mousemove(function(e){
        if(manual){
            navi.w = e.pageX - (navi.x + $(this).offset().left);
            navi.h = e.pageY - (navi.y + $(this).offset().top);

            context_navi.clearRect(0,0,canvas_navi.width,canvas_navi.height);
            context_navi.strokeStyle = "#F00";
            context_navi.lineWidth = 3;
            context_navi.strokeRect(navi.x, navi.y, navi.w, navi.h);
        }
    }).mouseup(function(e){
        manual = false;

        if(navi.w<0){
            navi.x += navi.w;
            navi.w *= (-1);
        }
        if(navi.h<0){
            navi.y += navi.h;
            navi.h *= (-1);
        }
        parameters.face_x = Math.floor((navi.x - navi.w/4)/ratio);
        parameters.face_y = Math.floor((navi.y - navi.h/10)/ratio);
        parameters.face_w = Math.floor(navi.w/ratio);
        parameters.face_h = Math.floor(navi.h/ratio);
    });
});



function resize(){
    canvas.height = window.innerHeight * 0.7;
    canvas.width = canvas.height * (img_current.width / img_current.height);
    $("#canvas").css({
        width: canvas.width,
        height: canvas.height,
        "margin-left": -(canvas.width/2)
    });

    canvas_navi.height = window.innerHeight * 0.7;
    canvas_navi.width = canvas_navi.height * (img_current.width / img_current.height);
    $("#navi").css({
        width: canvas_navi.width,
        height: canvas_navi.height,
        "margin-left": -(canvas_navi.width/2)
    });

    render();
}

function loadDataURL(url){

    var bin_data = url.slice(url.search(/base64/)+7);
    img_binary = atob(bin_data);
    return 0;
}

function loadImage(event){
    if(document.getElementById("files").files.length > 1){
        alert("Choose only 1 file.");
        return -1;
    }

    loaded = false;
    var file = event.target.files[0];
    var reader;
    var reader_original;

    reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (function(f){
        return function(e){
            img_current.src = e.target.result;

            img_current.onload = function(){
                context.clearRect(0,0,canvas.width, canvas.height);
                canvas.width = canvas.height * (img_current.width/img_current.height);
                ratio = (canvas.height/img_current.height);
                resize();

                context_hidden.clearRect(0,0,canvas_hidden.width, canvas_hidden.height);
                canvas_hidden.width = img_current.width;
                canvas_hidden.height = img_current.height;
                context_hidden.drawImage(img_current, 0, 0);

                loadDataURL( canvas_hidden.toDataURL('image/jpeg'));
                loaded = true;
            };

            parameters.type = 'image/jpeg';
        };
    })(file);

    reader_original = new FileReader();
    reader_original.readAsDataURL(file);
    reader_original.onload = (function(f){
        return function(e){
            img_original.src = e.target.result;
            ratio = (canvas.height/img_current.height);
            img_original.onload = function(){
                if($("#ccv_switch").is(':checked')){
                    $("#detecting").show();
                    if(getFace(img_original)){
                        $("#detecting").hide();
                    }
                }
            };

        };
    })(file);

    render();
    loaded = true;
    return 0;
}

function render(){
    context.drawImage(img_current, 0, 0, img_current.width, img_current.height, 0,0, canvas.width, canvas.height);
}

function getForm(){
    parameters.noise = $("#noise").val() / 100;
    parameters.complex = $("#complex").val();
}

function getFace(img){

    var comp = ccv.detect_objects({
        "canvas": ccv.grayscale(ccv.pre(img)),
        "cascade": cascade,
        "interval": 5,
        "min_neighbors": 1
    });

    if (comp[0]) {
        parameters.face_x = Math.floor(comp[0].x - comp[0].width / 4);
        parameters.face_y = Math.floor(comp[0].y - comp[0].height / 10);
        if(parameters.face_x<1) parameters.face_x = 0;
        if(parameters.face_y<1) parameters.face_y = 0;

        parameters.face_w = Math.floor(comp[0].width);
        parameters.face_h = Math.floor(comp[0].height);

        navi.x = Math.floor(comp[0].x*ratio);
        navi.y = Math.floor(comp[0].y*ratio);
        navi.w = Math.floor(comp[0].width*ratio);
        navi.h = Math.floor(comp[0].height*ratio);
    } else {
        parameters.face_x = 0;
        parameters.face_y = 0;
        parameters.face_w = img.width;
        parameters.face_h = img.height;

        navi.x = 0;
        navi.y = 0;
        navi.w = img.width;
        navi.h = img.height;
    }

    context_navi.clearRect(0,0,canvas_navi.width,canvas_navi.height);
    context_navi.strokeStyle = "#F00";
    context_navi.lineWidth = 3;
    context_navi.strokeRect(navi.x, navi.y, navi.w, navi.h);


    return true;
}

function draw(img){
    context.drawImage(img_original,0,0,img_original.width, img_original.height, 0,0, canvas.width, canvas.height);
}



function exportData(){
    window.open( canvas.toDataURL() );
}



var bin_temp;
var i;

function glitch() {
    $("#drawing").show();
    getForm();
    img_current = new Image();
    img_current.src = img_original.src;
    context.clearRect(0,0,canvas.width, canvas.height);
    context.drawImage(img_original, 0,0, img_original.width, img_original.height, 0,0, canvas.width, canvas.height);

    img_temp = new Image();
    i = Math.floor(parameters.complex / 2);

    bin_temp = Corruptions[parameters.type].apply(img_binary);
    img_temp.src = [
        'data:',
        parameters.type,
        ';base64,',
        base64encode(bin_temp)
    ].join('');

    glitch_loop(i);
}

function glitch_loop(num){
    var x, y, w, h;
    if(Math.random()<0.02){
        bin_temp = Corruptions[parameters.type].apply(img_binary);
        img_temp.src = [
            'data:',
            parameters.type,
            ';base64,',
            base64encode(bin_temp)
        ].join('');
    }
    //decide position,and size
    x = parameters.face_x + parameters.face_w * Math.random();
    y = parameters.face_y + parameters.face_h * Math.random();
    w = (parameters.face_x + parameters.face_w - x) * Math.random() * 1.1 + 4;
    h = (parameters.face_y + parameters.face_h - y) * Math.random() * 1.1 + 4;

    if(w < 130 && Math.random()>0.6){
        // swap
        w = [h, h = w][0];
    }


    if(x<0){
        x = 0;
    }else if(x > img_original.width){
        x = img_original.width;
    }

    if(y<0){
        y = 0;
    }else if(y > img_original.height){
        y = img_original.height;
    }

    if(x+w > img_original.width){
        w = img_original.width - x + 1;
        x--;
    }
    if(y+h > img_original.height){
        h = img_original.height - y + 1;
        y--;
    }
    ratio = (canvas.height/img_original.height);
    img_temp.width = img_original.width;
    img_temp.height = img_original.height;

    context.globalAlpha = Math.random() * parameters.noise;
    context.drawImage(img_temp, x, y, w, h, x*ratio , y*ratio, w*ratio , h*ratio );

    context.globalAlpha = 1.0;
    context_hidden.drawImage(img_temp, 0, 0);

    if(num!=0){
        num--;
        setTimeout(function(){
            glitch_loop(num);
        }, 40);
    }else{
        $("#drawing").hide();
        context_navi.clearRect(0,0,canvas_navi.width,canvas_navi.height);
    }
}



function saveURL(dst){
    dst = document.getElementById('canvas');
}

function restoreURL(url){
    var img = new Image();
    img.src = url;
    context.drawImage(img, 0, 0);
}



function base64decode(str) {
    return atob(str);
}


//
// code from http://userscripts.org/scripts/review/9653
//_____________________________________________________


function contentType(headers) {
  return headers.match(/Content-Type: (.*)/i)[1];
}

function base64encode(data) {
  return btoa(data.replace(/[\u0100-\uffff]/g, function(c) {
    return String.fromCharCode(c.charCodeAt(0) & 0xff);
  }));
}

function is_glitchable(img) {
  return img.src.match(/\.(gif|jpe?g)/i);
}
