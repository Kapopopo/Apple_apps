# Retire la tâche planifiée créée par scripts/schedule.ps1 (npm run unschedule).
$name = 'Component Atlas - verification des sources'
if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Output "Tâche « $name » retirée."
} else {
  Write-Output "Aucune tâche « $name » enregistrée."
}
