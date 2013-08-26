<!DOCTYPE html><html><head>
    <title>WebdriverJS Testpage</title>

    <style type="text/css">
    .box {
        width: 100px;
        height: 100px;
        float: left;
        border: magenta 1px solid;
        margin-right: 10px;
    }
    #githubRepo {
        display:block;
    }
    .red { background: red; }
    .green { background: green; }
    .yellow { background: yellow; }
    .black { background: black; }
    .purple { background: purple; }

    .overlay {
        background: none repeat scroll 0 0 #CCCCCC;
        height: 50px;
        width: 100px;
        z-index: 2;
        opacity: 0.5;
        position: relative;
    }
    .btn3 {
        margin: 15px;
        position: relative;
        z-index: 1;
        bottom: 50px;
    }
    .btn1_clicked,.btn2_clicked,.btn3_clicked,.btn4_clicked,
    .btn1_dblclicked,.btn2_dblclicked,.btn3_dblclicked,.btn4_dblclicked {
        display:none;
    }
    </style>

</head>
<body>

<h1>Test CSS Attributes</h1>
<hr>
<div class="box red" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
<div class="box green"></div>
<div class="box yellow"></div>
<div class="box black"></div>
<div class="box purple" id="purplebox"></div>

<a href="https://github.com" id="githubRepo" class="clearfix">GitHub Repo</a>

<div class="nested" style="text-transform: uppercase">
    <h2>nested elements</h2>
    <div>
        <span>nested span</span>
    </div>
</div>

<button class="btn1">Klick #1</button>
<div class="btn1_clicked">Button #1 clicked</div>
<div class="btn1_dblclicked">Button #1 dblclicked</div>
<button class="btn2" disabled="">Klick #2</button>
<div class="btn2_clicked">Button #2 clicked</div>
<div class="btn2_dblclicked">Button #2 dblclicked</div>
<div class="overlay" id="overlay" draggable="true" ondragstart="drag(event)">&nbsp;</div>
<button class="btn3">Klick #3</button>
<div class="btn3_clicked">Button #3 clicked</div>
<div class="btn3_dblclicked">Button #3 dblclicked</div>
<button style="height:0; border:0;" class="btn4">Klick #4</button>
<div class="btn4_clicked">Button #4 clicked</div>
<div class="btn4_dblclicked">Button #4 dblclicked</div>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script type="text/javascript">
    $('.btn1').click(function() {
        $('.btn1_clicked').css('display','block');
    });
    $('.btn2').click(function() {
        $('.btn2_clicked').css('display','block');
    });
    $('.btn3').click(function() {
        $('.btn3_clicked').css('display','block');
    });
    $('.btn4').click(function() {
        $('.btn4_clicked').css('display','block');
    });
    $('.btn1').dblclick(function() {
        $('.btn1_dblclicked').css('display','block');
    });
    $('.btn2').dblclick(function() {
        $('.btn2_dblclicked').css('display','block');
    });
    $('.btn3').dblclick(function() {
        $('.btn3_dblclicked').css('display','block');
    });
    $('.btn4').dblclick(function() {
        $('.btn4_dblclicked').css('display','block');
    });

    $('#overlay').click(function() {
        console.log('overlay was just clicked');
    });

    function allowDrop(e) {
        e.preventDefault();
    }

    function drag(e) {
        console.log('start drag',e);
        e.dataTransfer.setData("Text",e.target.id);
    }

    function drop(e) {
        e.preventDefault();
        console.log(e);
        var data=e.dataTransfer.getData("Text");
        e.target.appendChild(document.getElementById(data));
    }
</script>
<hr>
<input type="search" class="searchinput" name="searchinput">
<hr>
<form action="index.php" method="POST">
    <input name="a" value="a">
    <input name="b" value="b">
    <input name="c" value="c">
    <input type="submit" value="send" class="send">
</form>
<?php
if($_POST['a'] === 'a') echo '<div class="gotDataA">got data from input[name="a"]';
if($_POST['b'] === 'b') echo '<div class="gotDataB">got data from input[name="b"]';
if($_POST['c'] === 'c') echo '<div class="gotDataC">got data from input[name="c"]';

?>
</body></html>