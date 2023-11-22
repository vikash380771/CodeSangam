
document.querySelector('.btne').addEventListener('click', function() {
    alert('You are exploring more!'); 
});


document.addEventListener("DOMContentLoaded", function () {
    let currentSlide = 0;
    const slides = document.querySelectorAll(".slide");

    function showSlide(index) {
        slides[currentSlide].style.display = "none";
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].style.display = "block";
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    
    setInterval(nextSlide, 3000); 

    
    showSlide(currentSlide);
});



function redirectToSignUp() {
    window.location.href = "../tempelates/signup.hbs";
}