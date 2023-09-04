FAQ

can I close the app?
you have to keep it running but you can minimize it





=---
settings are not being changed with model



sending settings via ipc
sending status too... 
what else?...
need to send the messages as they update from chatbot for history... 

should the ui ask for that data?
well... I guess for status and message history it has to push the data irl
but for settings it can just ask for it when it loads



## settings defaults added in loadSettings


## making save settings now





## how to keep status?
just update sending a message via ipc ?








# settings table:
id
key
value

openai api key:
twitch access token: 
    (how to get one: twitchapps.com/tmi/)
channels: (comma separated)
trigger word:
system_message: 
max_context_messages: 
data_refresh_interval: 
    (in seconds)

# data table:
key: string unique key
value: text
user: string but can be null
updated_at: timestamp updated when value is updated
created_at: timestamp

tokens


# context_messages table
id: int
channel: string
user: string
role: string
message: text
created_at: timestamp
