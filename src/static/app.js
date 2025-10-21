document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear and reset activity select to avoid duplicate options when re-rendering
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (bulleted list or friendly message)
        const participants = details.participants || [];
        // Build participants HTML with delete buttons
        let participantsHTML = `<div class="participants"><h5>Participants</h5>`;
        if (participants.length) {
          participantsHTML += `<ul>`;
          participantsHTML += participants
            .map(
              (p) =>
                `<li><span class="participant-email">${p}</span> <button class="unregister-btn" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(p)}" title="Remove participant">✖</button></li>`
            )
            .join("");
          participantsHTML += `</ul>`;
        } else {
          participantsHTML += `<p class="no-participants">No participants yet</p>`;
        }
        participantsHTML += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Attach unregister handlers for the buttons we just added
        // Use event delegation on the activityCard to be safe
        activityCard.addEventListener("click", async (ev) => {
          const btn = ev.target.closest(".unregister-btn");
          if (!btn) return;
          const activityName = decodeURIComponent(btn.dataset.activity);
          const email = decodeURIComponent(btn.dataset.email);

          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

          try {
            const resp = await fetch(
              `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(
                email
              )}`,
              { method: "POST" }
            );

            const resJson = await resp.json();
            if (resp.ok) {
              // Refresh activities list
              fetchActivities();
              messageDiv.textContent = resJson.message;
              messageDiv.className = "message success";
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 4000);
            } else {
              messageDiv.textContent = resJson.detail || "Failed to unregister";
              messageDiv.className = "message error";
              messageDiv.classList.remove("hidden");
            }
          } catch (err) {
            console.error("Error unregistering:", err);
            messageDiv.textContent = "Failed to unregister. Please try again.";
            messageDiv.className = "message error";
            messageDiv.classList.remove("hidden");
          }
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Show success and refresh activities immediately so UI updates without full page refresh
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh the activity list and dropdown so the new participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
