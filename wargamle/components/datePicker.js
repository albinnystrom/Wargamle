export function initializeDatePicker() {
  const picker = document.getElementById("datePicker");
  const today = new Date().toISOString().split("T")[0];
  picker.setAttribute("max", today);
  const savedDate = localStorage.getItem("wgrdle_selected_date");

  if (savedDate && savedDate <= today) {
    picker.value = savedDate;
  } else {
    picker.value = today;
    localStorage.setItem("wgrdle_selected_date", today);
  }

  document.getElementById("datePicker").addEventListener("change", () => {
    const dailyToggle = document.getElementById("dailyToggle");
    const dateValue = document.getElementById("datePicker").value;

    if (dailyToggle.checked) {
      localStorage.setItem("wgrdle_selected_date", dateValue);
      location.reload();
    }
  });
}
