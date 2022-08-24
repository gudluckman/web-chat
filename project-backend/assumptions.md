# Assumptions for Iteration 1

#### Assume that authUserId is authorised when calling all these functions. (Mark this)

1. Assumptions for auth.js:
    - Assume that email and password will not be an empty string. (Mark this)
    - Assume that nameFirst and nameLast will contain at least 1 alphanumeric character. (Mark this)
    - Assume when password is greater than 6 characters, no errors will be encountered.

2. Assumptions for channel.js:
    - Assume that `start` will always be a positive integer. (Mark this)
    - Assume that the messages array is empty in the channel object.  

3. Assumptions for channels.js:
    - Assume that both private and public channels will be returned when running channelsListV1. (Mark this)
    - Assume that if no channels exist, an empty array returned for both channelsList and channelsListAll. (Mark this)
