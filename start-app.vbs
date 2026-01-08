Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Obtenir le repertoire du script
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Changer le repertoire courant
objShell.CurrentDirectory = strPath

' Lancer le batch
objShell.Run "start-app.bat", 1, False