# SPL Syntax Highlighting Showcase

````spl
``` Detect suspicious process execution from Sysmon logs - all highlight types demo ```

| tstats summariesonly=true count min(_time) as firstTime max(_time) as lastTime from datamodel=Endpoint.Processes where Processes.dest="*" Processes.CommandLine="*powershell*" by Processes.Image, Processes.CommandLine, Processes.ParentImage, Processes.user, Processes.dest
| `drop_dm_object_name(Processes)`
| `security_content_ctime(firstTime)`
| eval risk_score=if(match(CommandLine, "(?i)(invoke-expression|encodedcommand|bypass|hidden)"), 90, 50), severity=case(risk_score >= 90 and count > 100, "critical", risk_score >= 75 or count > 50, "high", true(), "low")
| search NOT [| inputlookup service_accounts.csv | fields user | format]
| lookup geo_ip_lookup ip as src OUTPUT city, country
| where severity!="low" and isnotnull(CommandLine) and len(CommandLine) > 100
| stats count as total_events, dc(dest) as unique_hosts, values(severity) as severities, earliest(firstTime) as first_seen, latest(lastTime) as last_seen by Image, ParentImage, user, country
| eval first_seen=strftime(first_seen, "%Y-%m-%d %H:%M:%S"), last_seen=strftime(last_seen, "%Y-%m-%d %H:%M:%S"), bytes_mb=round(total_bytes / 1024 / 1024, 2), is_internal=if(cidrmatch("10.0.0.0/8", src) or cidrmatch("172.16.0.0/12", src), "true", "false"), indicators=mvappend(if(total_events > 1000, "high_volume", null()), if(unique_hosts > 10, "lateral_movement", null()))
| `apply_risk_framework(severity)`
| sort -total_events
| head 500
| table Image, ParentImage, user, country, total_events, unique_hosts, severities, first_seen, last_seen
````
