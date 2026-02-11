@echo off

echo hello
mshta vbscript:Execute("msgbox ""Hello World"", 64, ""Hello World"":close")
