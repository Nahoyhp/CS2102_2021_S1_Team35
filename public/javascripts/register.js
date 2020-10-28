$(document).ready(function(){
  $(".petowner").hide();
  $(".address").hide();  
})

$('select').on('change', function() {
  var role =  this.value ;
  if (role == "petowner"){ 
  	$(".petowner").show();
  	$(".address").show();  
  } else if (role == "caretaker") {
  	$(".petowner").hide();
  	$(".address").show();
  } else if (role == "petowner-caretaker"){
  	$(".petowner").show();
  	$(".address").show();	
  } else {
  	$(".petowner").hide();
  	$(".address").hide();
  }
});