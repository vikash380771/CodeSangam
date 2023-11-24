
 function redirectTohome() {
    window.location.href = "../home page/index.html";
 }

 document.addEventListener("DOMContentLoaded", function () {
    var todoContainer = document.getElementById("todo-container");
    var todoContainerform = document.getElementById("container-form");
    var opentodoBtn = document.getElementById("open-todo-btn");
    var todovideo = document.getElementById("todo-video");

    opentodoBtn.addEventListener("click", function () {
        todoContainer.style.display = "block";
        todovideo.style.display = "block";
        todoContainerform.style.display = "block";
    });
  });

  function closeLogin() {
    var todoContainer = document.getElementById("todo-container");
    var todoContainerform = document.getElementById("container-form");
    var todovideo = document.getElementById("todo-video");
    todoContainer.style.display = "none";
    todovideo.style.display = "none";
    todoContainerform.style.display = "none";
  }