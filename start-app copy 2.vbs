Option Explicit
Dim fso, sh, proj, serverDir, backendPort, frontendPort
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")

' === CONFIG ===
backendPort = 4000          ' mets p.ex. 3000 si tu connais le port du backend, sinon 0 pour désactiver le check
frontendPort = 8080      ' port du front (URL à ouvrir)
' ==============

proj = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = proj & "\server"

' -------- Utils --------
Function PortBusy(p)
  Dim e, line, busy
  If p <= 0 Then PortBusy = False : Exit Function
  Set e = sh.Exec("cmd /c netstat -ano -p tcp")
  busy = False
  Do Until e.StdOut.AtEndOfStream
    line = LCase(e.StdOut.ReadLine())
    If InStr(line, ":" & CStr(p) & " ") > 0 And (InStr(line, "listening") > 0 Or InStr(line, "established") > 0) Then
      busy = True : Exit Do
    End If
  Loop
  PortBusy = busy
End Function

Sub StartHidden(cmd, workdir)
  sh.CurrentDirectory = workdir
  sh.Run "cmd /c " & cmd, 0, False
End Sub
' -----------------------

' Backend: lance seulement si le port n'est pas occupé (ou check désactivé)
If backendPort = 0 Or Not PortBusy(backendPort) Then
  StartHidden "npm run start", serverDir
End If

' Frontend: lance seulement si le port n'est pas occupé
If Not PortBusy(frontendPort) Then
  StartHidden "npm run dev", proj
End If

' Attends que le front soit up puis ouvre le navigateur
Dim timeoutMs, stepMs, elapsed
timeoutMs = 30000 : stepMs = 1000 : elapsed = 0
Do While Not PortBusy(frontendPort) And elapsed < timeoutMs
  WScript.Sleep stepMs
  elapsed = elapsed + stepMs
Loop
sh.Run "http://localhost:" & CStr(frontendPort) & "/", 1, False
