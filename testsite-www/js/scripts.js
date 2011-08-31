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
		
		
		
	}
)