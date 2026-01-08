Option Explicit
Dim fso, sh, proj, serverDir
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")

proj = fso.GetParentFolderName(WScript.ScriptFullName) ' dossier du script
serverDir = proj & "\server"

' Backend (server)
sh.CurrentDirectory = serverDir
sh.Run "cmd /c npm run start", 0, False  ' 0 = caché

' Frontend (racine)
sh.CurrentDirectory = proj
sh.Run "cmd /c npm run dev", 0, False    ' 0 = caché

' Attendre que ça démarre, puis ouvrir le navigateur
WScript.Sleep 8000                       ' ajuste si besoin (ms)
sh.Run "http://localhost:8080/", 1, False
