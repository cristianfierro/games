$( document ).ready(function() {

	var G = {};
	$container = $("#container");
	
	function gameLoad( ) {
		$.getJSON( dataUrl, function( data ) {
			G.data = data;
			gameBegin();
			
		});
	}
	
	gameLoad();
	
	function gameBegin() {

		
		
		var button = '';
		button += '<a class="answer start" href="#">Generate Pro Golfer Name</a>';
		$("#container").append(button);
		
		$(".start").click(function(event) {
			event.preventDefault();
			$(".start").fadeOut(function(){
			
				$container.append("<h1>"+getRandomName()+"</h1>");		
				$("h1").fitText();
				
				var reload = '';
				reload += '<div class="button-holder"><a class="answer reload" href="#">Generate Another</a></div>';
				$("#container").append(reload);
				$(".reload").click(function(event) {
					event.preventDefault();
					$("h1").fadeOut(function(event) {
						$("h1").html(getRandomName());
						$("h1").fadeIn();
					});
				});
				
			});
			
		});
		
	}
	
	function getRandomName() {
		var randomIndex = Math.floor(Math.random()*G.data.length);
		var randomIndex2 = Math.floor(Math.random()*G.data.length);
		var firstName = G.data[randomIndex]
		var lastName = G.data[randomIndex2]
		var fullName = firstName+" "+lastName;
		return fullName;
	}
	
	
	
	
});