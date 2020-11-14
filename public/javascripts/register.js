$(document).ready(function(){
  $(".petowner").hide();
  $(".address").hide();
  $(".caretaker").hide();
})

$('#role').on('change', function() {
  var role =  this.value ;
  if (role == "petowner"){ 
  	$(".petowner").show();
  	$(".address").show();
    $(".caretaker").hide();
  } else if (role == "caretaker") {
  	$(".petowner").hide();
  	$(".address").show();
    $(".caretaker").show();
  } else if (role == "petowner-caretaker"){
  	$(".petowner").show();
  	$(".address").show();	
    $(".caretaker").show();
  } else {
  	$(".petowner").hide();
  	$(".address").hide();
    $(".caretaker").hide();
  }
});