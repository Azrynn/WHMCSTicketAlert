// ==UserScript==
// @name         Notification WIP
// @namespace    https://billing.apexminecrafthosting.com/admin/supporttickets.php
// @version      0.0.4
// @description  do stuff i guess
// @author       Lark, Ritty
// @match        https://billing.apexminecrafthosting.com/admin/supporttickets.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
	
	//Yes yes, terrible JS, I know
	
    //Add audio alert
    var alert = document.createElement('audio');

    //Uncomment the alert you want for the time being, until I implement a dropdown
    //Enemy alert
        //alert.setAttribute('src', 'https://media.vocaroo.com/mp3/alAq2Ze69pA');
    //Woop woop
        //alert.setAttribute('src', 'https://media.vocaroo.com/mp3/lfLZhNIN7sI');
    //Notif sound (that won't mess with your ears)
        alert.setAttribute('src', 'https://media.vocaroo.com/mp3/jsQgatEJ1FZ');

    //Checkbox
    var sidebar = document.getElementById("sidebar")
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox"
    sidebar.appendChild(checkbox);

    //Checkbox label
    var label = document.createElement("label");
    label.textContent = " Notification enabled";
    sidebar.appendChild(label);
	
    //Volume slider
    var slidername = document.createElement("label");
    slidername.textContent = "Volume: ";
    sidebar.appendChild(slidername);

	var slider = document.createElement("input");
	slider.type = "range";
    sidebar.appendChild(slider);

    //Get if it's checked from localStorage. If it doesn't exist, default as checked and save to localStorage for persistency.
    var notifEnabled = JSON.parse(window.localStorage.getItem("isChecked"));
    if (notifEnabled == null) {
        notifEnabled = true;
        window.localStorage.setItem("isChecked", "true");
        checkbox.setAttribute("checked", "");
    }
    else if (notifEnabled == true) {
        checkbox.setAttribute("checked", "");
    }

    //Set checkbox to on/off state depending on local cache; listen and save to local cache as changes are made
    checkbox.addEventListener( 'change', function() {
    if(this.checked) {
        console.log("Checkbox is checked.");
        window.localStorage.setItem("isChecked", "true");
        notifEnabled = true;
    }
    else {
        console.log("Checkbox is not checked");
        window.localStorage.setItem("isChecked", "false");
        notifEnabled = false;
    }
    });
    
    //Get volume from localStorage. If it doesn't exist, default as 50 and save to localStorage for persistency.
    var sliderValue = JSON.parse(window.localStorage.getItem("sliderVol"));
    if (sliderValue == null) {
        sliderValue = 50;
        alert.volume = 0.5;
        slidername.textContent = "Volume: " + 50;
        window.localStorage.setItem("sliderVol", 50);
    }
    else if (sliderValue != null) {
        slider.value = sliderValue;
        alert.volume = sliderValue / 100;
        slidername.textContent = "Volume: " + sliderValue;
    }

    //Set volume number and write to local storage and slider is moved
    slider.oninput = function() {
        alert.volume = sliderValue / 100;
        slidername.textContent = "Volume: " + this.value;
        window.localStorage.setItem("sliderVol", this.value);
    }
	
	//Dropdown selection menu is WIP


    //Check if there are any tickets, then do the notifications accordingly.
    if (checkTableForUpdates() == 1) {
        //Set favicon to notif favicon; have to create a new element since it's implicit by default
        var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = 'https://www.dropbox.com/s/tnyeqmwa0sr71r1/favicon.ico?dl=1';
        document.getElementsByTagName('head')[0].appendChild(link);
        //If notifications are enabled, play notification.
        if (notifEnabled) {
            alert.play();
        }
    }

	//Helper functions that do the actual work

	//Get array of current tickets
    function getTicketsArray() {
        var tickets = [];
        //Get tickets table from page
        var ticketsTable = document.getElementById('sortabletbl2');
        //Loop through ticket table, fill tickets[] with the ticket ids + Status
        for (var i=1; i < ticketsTable.rows.length; i++) {
            var ticket = [ticketsTable.rows[i].cells[3].textContent.substring(1, 7), ticketsTable.rows[i].cells[5].textContent];
            tickets.push(ticket);
        };
        return tickets;
    }

    //Save ticket to local cache
    function saveToLocalStorage(tickets) {
        var date = new Date;
        var timestamp = date.getTime();
        window.localStorage.setItem('tickets', JSON.stringify(tickets));
        window.localStorage.setItem('ticketsTimestamp', timestamp);
    }

    //Check if any new tickets have been added and play alert sound; don't play alert sound if tickets have been removed
    //Return 1 if it should send an alert, 0 if it shouldn't
    function checkTableForUpdates() {
        console.log("Checking for ticket updates.");
        var newTickets = getTicketsArray();
        var oldTickets = JSON.parse(window.localStorage.getItem('tickets'));

        //Don't play alert on first page launch, but populate the local storage with the current tickets.
        if (oldTickets == null) {
            saveToLocalStorage(newTickets);
            console.log("Created starting TicketsArray + timestamp!");
            return 0;
        };
        // Check if there have been any updates, return true or false, and don't forget to
        // Loop through the newTickets array, compare to oldTickets.
        // Conditions:
        //    If the new ticket is In Progress or On Hold, that means it's being handled. Ignore it, even if it existed previously.
        //    If the new ticket is Open or Customer-Reply, check if it existed before so we don't alert for stuff that we already saw.
        //    If it existed before:
        //      Send alert if it went from On Hold/In Progress to Open/Customer-Reply.
        //      If not, ignore the whole new ticket and move onto the next one.
        //    If the above conditions aren't met, then the ticket is new and didn't appear in the list previously. Check if it's being
        //    handled by someone or not. If not, send alert. Otherwise, move onto the next one.
        // Always save the current tickets to the local storage before breaking the main loop or exiting the function.
        newTicketLoop:
        for (var i=0; i < newTickets.length; i++) {
            if (newTickets[i][1] == "On Hold" || newTickets[i][1] == "In Progress") {
                continue;
            }
            oldTicketLoop:
            for (var j=0; j < oldTickets.length; j++) {
                //Compare ticket IDs to see if it existed previously.
                if (newTickets[i][0] == oldTickets[j][0]) {
                    if (oldTickets[j][1] == "On Hold" || oldTickets[j][1] == "In Progress") {
                        saveToLocalStorage(newTickets);
                        console.log("Old ticket updated to be worked on.");
                        return 1;
                    }
                    continue newTicketLoop;
                }
            }
            if (newTickets[i][1] == "Open" || newTickets[i][1] == "Customer-Reply") {
                saveToLocalStorage(newTickets);
                console.log("Brand new ticket ready to be worked on.");
                return 1;
            }
        }
        //If none of these conditions pass, don't alert.
        saveToLocalStorage(newTickets);
        console.log("No new or workable tickets.");
        return 0;
    };

})();
