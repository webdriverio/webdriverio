$(document.body).ready(
	function()
	{
		
		$("#submit").click(
			function()
			{
				setTimeout(
					function()
					{
						$(document.body).append($("<div id='datamaskin'>datamaskin</div>"));
					}, 2000
				);
				
				$("#sign").toggle();
				
			}
		);
		
		$(".dragItem").draggable({
		    revert: "invalid"
		});
        $("#dropContainer").droppable({
			hoverClass: "ui-state-active",
			accept: ".dragItem",
			drop: function( event, ui ) {
			    var draggable = $(ui.draggable);
			    draggable.css({"top": "", "position": ""})
			    var droppable = $(this);
			    droppable.append(draggable);
            }
		});
		
		
		
	}
)