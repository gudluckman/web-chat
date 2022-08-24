```javascript
// TODO: insert your data structure that contains users + channels info here
// You may also add a short description explaining your design

// Array of objects for 'user'
// every user will have their own 'user' object contained in the users array.
// Within the 'user' object it contains the basic details of the user and 'uId' & 'password' assigned for that specific user.
users = [
  {
    'uId': 1,
    'password': 'eggsforever',
    'nameFirst': 'Allen',
    'nameLast': 'Yeh',
    'email': 'z3393576@unsw.edu.au',
    'permissionId': 1,
    'phoneNumber': '0422664569',
    'handleStr' : 'allenyeh'
  }
];

// Array of objects for 'channel'
// Each channel created will have its own object and will be contained in the channels array.
// Within the key 'authUserId' it will be an array containing 'uId's that are authenticated for the channel.
channels = [
  {
    'name': 'eggs_chat',
    'channelId': 101,
    'isPublic': true,
    'ownerMembers': [
      {
        'uId': 1,
        'email': 'z3393576@unsw.edu.au',
        'nameFirst': 'Allen',
        'nameLast': 'Yeh',
        'handleStr': 'allenyeh'
      }
    ],
    'allMembers': [
      {
        'uId': 1,
        'email': 'z3393576@unsw.edu.au',
        'nameFirst': 'Allen',
        'nameLast': 'Yeh',
        'handleStr': 'allenyeh'
      }
    ],
    'messages': [
      {
        'messageId': 10,
        'uId': 1,
        'message': 'hello world',
        'timeSent': 1655781342,
      }
    ]
  }
];

```
