# Vérification hebdomadaire des sources (Windows, Planificateur de tâches).
# Lance « npm run outdated » chaque lundi à 9 h : compare les commits verrouillés (importers/lock.json)
# aux derniers commits publiés et écrit registry/_updates.json. Rien n'est importé ni modifié d'autre :
# le builder signale les sources à mettre à jour, « npm run update » les importe quand vous le décidez.
#
#   npm run schedule      (enregistre la tâche pour l'utilisateur courant, sans droits administrateur)
#   npm run unschedule    (la retire)
param([string]$Day = 'Monday', [string]$At = '09:00')

$ErrorActionPreference = 'Stop'
$name = 'Component Atlas - verification des sources'
$root = Split-Path -Parent $PSScriptRoot
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$log = Join-Path $root 'registry\_updates.log'

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"`"$npm`" run -s outdated >> `"$log`" 2>&1`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Description 'Compare les sources de Component Atlas a leurs commits verrouilles (npm run outdated). Aucune importation automatique.' -Force | Out-Null
Write-Output "Tâche « $name » enregistrée : chaque $Day à $At (journal : registry\_updates.log)."
