var tasks = {};

// a call is made to createTask(taskTest, takeDate, taskList), passing in the task's/
// description, due date, and type
// these 3 data points create a <li> element with child <span> and <p> elements that's appended to a <ul> element
var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date (executing before we add task item to page - want to ensure element has all of its proper classes before getting to the page)
  // do this bc adding it & changing looks after would confuse user
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// addClass() and text() are jQuery
// list-group-item & badge are Bootstrap classes
// addClass() method changes element's text content (sim. to element.textContent=""; in plain JS)

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

// saveTasks function saves the tasks object in localStorage
// tasks are saved in an array that's a property of an object (mult lists would added). Can see this more easily in loadTasks()function
var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// create function and set it to accept the task's <li> element as a parameter
var auditTask = function (taskEl) {
  //get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task if near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }

  console.log(taskEl);
};

// tasks can now be dragged within the same column and across other columns.
// use jQuery selector to find all list-group elements w/ class list-group. Then use jQuery slector to find all list-group selements, then call a new jQuery UI method on them.
// jQuery UI method sortable() turned every element w/ the class list-group into a sortable list
// connectWith property linked these sortable lists w/ any other lists that have the same class
$(".card .list-group").sortable({
  //enable dragging across lists
  connectWith: ".card .list-group",
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    console.log("activate", this);
    $(this).addClass("dropover");
    $(".bottom-trash").addClass(".bottom-trash-drag");
  },
  deactivate: function (event) {
    console.log("deactivate", this);
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass(".bottom-trash-drag");
  },
  over: function (event) {
    console.log("over", event.target);
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    console.log("out", event.target);
    $(event.target).removeClass("dropover-active");
  },
  update: function (event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();

        var date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
      });

    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
  stop: function (event) {
    $(this).removeClass("dropper");
  },
});

// trash icon can be dropped onto
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    // remove dragged element from the DOM
    ui.draggable.remove();
    $(".bottom-trash").addClass(".bottom-trash-active");
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass(".bottom-trash-active");
  },
});

// convert text field into a jquery date picker 
$("#modalDueDate").datepicker();
({
  minDate: 1,
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked (this code captures button click)
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// task text was clicked
$(".list-group").on("click", "p", function () {
  //get current text of p element
  var text = $(this).text().trim();

  // create new <textare> element & replace p element with a new textarea --> $(this).replaceWith(textInput);
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);

  // auto focus new element (focus=an event can be triggered programmatically)
  textInput.trigger("focus");
});

//editable field was un-focused
// want <textarea> to revert back when it goes out of focus (when click anywhere else, blue highlight box goes away and it saves task as is)
$(".list-group").on("blur", "textarea", function () {
  // variable declarations added...
  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  // .replace() is a reg JS operator to find & replace text in a string
  // chain jQuery & JS operators together in operations = great
  // chaining it to attr() which is returning the ID which will be "list-" followed by the category
  // then chaining it to .replace() to remove "list-" from the text --> give us category name (ex. "toDo") that will match /
  // one of the arrays on the tasks object (tasks.toDo)

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localStorage
  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);

  // replce textarea with p element
  $(this).replaceWith(taskP);
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// due date event listner to edit it when clicked
// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      //when calendar is closed, force a "change" event on the "dateInput"
      $(this).trigger("change");
    },
  });

  // automatically focus on new element
  // automatically bring up the calendar
  dateInput.trigger("focus");
});

// convert them back when the user clicks outside (aka when element's blur event occurs)
// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closet(".list-group-item"));
});


setInterval(function () {
  $(".card .list-group-item").each(function(index, el){
    auditTask(el);
  });
}, (1000 * 60) * 30);

// load tasks for the first time
loadTasks();
