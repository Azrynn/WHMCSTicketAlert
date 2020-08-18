// ==UserScript==
// @name         WHMCS Notifications
// @namespace    https://billing.apexminecrafthosting.com/admin/supporttickets.php
// @version      0.4
// @description  Adds customisable notifications to the Ticket page on WHMCS
// @author       Lark, Ritty
// @match        https://billing.apexminecrafthosting.com/admin/supporttickets.php*
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    //Yes yes, terrible JS, I know

    //Add audio alert
    var alert = document.createElement("audio");

    //
    //PAGE LAYOUT SETUP
    //

    //Find the sidebar and add a break at the bottom
    var sidebar = document.getElementById("sidebar");
    sidebar.appendChild(document.createElement("br"));

    //Checkbox
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
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

    //Dropdown
    var dropdown = document.createElement("select");
    var soundValue = window.localStorage.getItem("whmcs_notif_sound");
    dropdown.className = "form-control input-sm";
    dropdown.appendChild(new Option("Blip Alert", 1, true, soundValue == 1));
    dropdown.appendChild(new Option("Woop Woop!", 2, false, soundValue == 2));
    dropdown.appendChild(new Option("Metal Gear Alert", 3, false, soundValue == 3));
    dropdown.appendChild(new Option("Custom Sound", 4, false, soundValue == 4));
    sidebar.appendChild(dropdown);

    //Popup
    function createPopup(){
        //Overlay and Popup
        var overlay = document.createElement("div");
        overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
        overlay.style.position = "fixed";
        overlay.style.height = "100%";
        overlay.style.width = "100%";
        overlay.style.top = "0%";
        overlay.style.left = "0%";
        overlay.style.zIndex = "2";

        var popup = document.createElement("div");
        popup.style.backgroundColor = "#F1F0E7";
        popup.style.border = "4px solid #E2E0CD";
        popup.style.position = "fixed";
        popup.style.height = "20%";
        popup.style.width = "30%";
        popup.style.top = "40%";
        popup.style.left = "35%";
        overlay.appendChild(popup);

        //Title
        var pTitle = document.createElement("text");
        pTitle.textContent = "Enter a Download URL for a Custom Sound";
        popup.appendChild(pTitle);

        popup.appendChild(document.createElement("br"));

        var pForm = document.createElement("input");
        pForm.className = "form-control";
        var soundURL = window.localStorage.getItem("whmcs_notif_soundURL");
        pForm.value = soundURL;
        popup.appendChild(pForm);

        popup.appendChild(document.createElement("br"));

        var pSubmit = document.createElement("button");
        pSubmit.className = "btn btn-default";
        pSubmit.innerHTML = "Submit";
        pSubmit.onclick = function () {
            window.localStorage.setItem("whmcs_notif_soundURL", pForm.value);
            alert.setAttribute("src", pForm.value);
            alert.play();
            overlay.parentNode.removeChild(overlay);
        };
        popup.appendChild(pSubmit);

        document.body.appendChild(overlay);
    }

    //
    //VARIABLE SETUP
    //

    //Set alert based on currently selected in Dropdown
    if (soundValue === null) {
        window.localStorage.setItem("whmcs_notif_sound",1);
        alert.setAttribute("src", browser.runtime.getURL("sounds/blip.mp3"));
    }

    //Set sound function
    function setSound(soundValue) {
        if (soundValue == 1) {
            alert.setAttribute("src", browser.runtime.getURL("sounds/blip.mp3"));
        }
        else if (soundValue == 2) {
            alert.setAttribute("src", browser.runtime.getURL("sounds/woop.mp3"));
        }
        else if (soundValue == 3) {
            alert.setAttribute("src", browser.runtime.getURL("sounds/enemy.mp3"));
        }
    }
    setSound(soundValue);


    //Get if it's checked from localStorage. If it doesn't exist, default as checked and save to localStorage for persistency.
    var notifEnabled = JSON.parse(window.localStorage.getItem("whmcs_notif_isChecked"));
    if (notifEnabled === null) {
        notifEnabled = true;
        window.localStorage.setItem("whmcs_notif_isChecked", "true");
        checkbox.setAttribute("checked", "");
    }
    else if (notifEnabled === true) {
        checkbox.setAttribute("checked", "");
    }

    //Set checkbox to on/off state depending on local cache; listen and save to local cache as changes are made
    checkbox.addEventListener( "change", function() {
    if(this.checked) {
        console.log("Checkbox is checked.");
        window.localStorage.setItem("whmcs_notif_isChecked", "true");
        notifEnabled = true;
    }
    else {
        console.log("Checkbox is not checked");
        window.localStorage.setItem("whmcs_notif_isChecked", "false");
        notifEnabled = false;
    }
    });

    //Get volume from localStorage. If it doesn't exist, default as 50 and save to localStorage for persistency.
    var sliderValue = window.localStorage.getItem("whmcs_notif_sliderVol");
    if (sliderValue === null) {
        sliderValue = 50;
        alert.volume = 0.5;
        slidername.textContent = "Volume: " + 50;
        window.localStorage.setItem("whmcs_notif_sliderVol", 50);
    }
    else if (sliderValue !== null) {
        slider.value = sliderValue;
        alert.volume = sliderValue / 100;
        slidername.textContent = "Volume: " + sliderValue;
    }

    //Set volume number and write to local storage and slider is moved
    slider.oninput = function() {
        sliderValue = this.value;
        alert.volume = sliderValue / 100;
        slidername.textContent = "Volume: " + this.value;
        window.localStorage.setItem("whmcs_notif_sliderVol", sliderValue);
    };



    //Dropdown set up audio when input is detected
    dropdown.oninput = function() {
        soundValue = dropdown.options[dropdown.selectedIndex].value;
        window.localStorage.setItem("whmcs_notif_sound",soundValue);
        if(soundValue == 4) {
            createPopup();
        }
        else {
            setSound(soundValue);
            alert.play();
        }
    };

    //Check if there are any tickets, then do the notifications accordingly.
    if (checkTableForUpdates() == 1) {
        //Set favicon to notif favicon; have to create a new element since it's implicit by default
        var link = document.querySelector("link[rel*='icon']") || document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        link.href = browser.runtime.getURL("icons/favicon.ico");
        document.getElementsByTagName("head")[0].appendChild(link);
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
        var ticketsTable = document.getElementById("sortabletbl2");
        //Loop through ticket table, fill tickets[] with the ticket ids + Status
        for (var i=1; i < ticketsTable.rows.length; i++) {
            var ticket = [ticketsTable.rows[i].cells[3].textContent.substring(1, 7), ticketsTable.rows[i].cells[5].textContent];
            tickets.push(ticket);
        }
        return tickets;
    }

    //Save ticket to local cache
    function saveToLocalStorage(tickets) {
        window.localStorage.setItem("whmcs_notif_tickets", JSON.stringify(tickets));
    }

    //Check if any new tickets have been added and play alert sound; don't play alert sound if tickets have been removed
    //Return 1 if it should send an alert, 0 if it shouldn't
    function checkTableForUpdates() {
        console.log("Checking for ticket updates.");
        var newTickets = getTicketsArray();
        var oldTickets = JSON.parse(window.localStorage.getItem("whmcs_notif_tickets"));

        //Don't play alert on first page launch, but populate the local storage with the current tickets.
        if (oldTickets === null) {
            saveToLocalStorage(newTickets);
            console.log("Created starting TicketsArray!");
            return 0;
        }
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
    }

})();