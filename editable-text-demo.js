Posts = new Mongo.Collection('posts');
Comments = new Mongo.Collection('comments');

Schemas = {};

Schemas.Post = new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    optional:true,
    max: 200
  },
  body: {
    type: String,
    label: "Body",
    optional:true
  },
  timestamp: {
    type: Number,
    label: "Timestamp"  
  },
  user: {
    type: String,
    label: "User",
    optional: true  
  },
  tags: {
    type: [String],
    label: "Tags",
    optional: true
  }
});

Schemas.Comment = new SimpleSchema({
  text: {
    type: String,
    label: "text",
    optional: true
  },
  post_id: {
    type: String,
    label: "post_id"
  },
  timestamp: {
    type: Number,
    label: "Timestamp"  
  },
  user: {
    type: String,
    label: "User",
    optional: true  
  }
});

Schemas.User = new SimpleSchema({
    emails: {
        type: [Object],
        optional: true
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    createdAt: {
        type: Date
    },
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    profile: {
        type: Object,
        optional: true,
        blackbox: true
    }
});

Posts.attachSchema(Schemas.Post);
Comments.attachSchema(Schemas.Comment);
Meteor.users.attachSchema(Schemas.User);

// Config for editable text widget
EditableText.useTransactions = true;
EditableText.maximumImageSize = 200000;

EditableText.registerCallbacks({
  addTimestampToDoc : function (doc) {
    var extraFields = {timestamp: Date.now()};
    if (Meteor.user()) {
      extraFields.user = Meteor.user().emails[0].address;
    }
    return _.extend(doc, extraFields);
  },
  callMethod : function (doc, Collection, newValue) {
    if (Meteor.isClient) {
      Meteor.call("testMethod", doc);
    }
    return newValue;
  }
});

Meteor.methods({
  "testMethod" : function (doc) {
    // console.log("Method doc: ", doc);  
  }
});

// Config for transactions
tx.requireUser = false; // Means a user who is not logged in gets to undo/redo

if (Meteor.isClient) {
  
  tx.undoRedoButtonClass = 'btn btn-default undo-redo';
  Session.setDefault('editor', 'default');
  EditableText.froalaDefaultOptions = {enter: $.FroalaEditor.ENTER_DIV};

  Template.posts.helpers({
    posts: function() {
      return Posts.find({}, {sort: {timestamp: -1}});
    },
    comments: function() {
      return Comments.find({post_id: this._id}, {sort: {timestamp: 1}});
    },
    newCommentDoc: function() {
      return {};  
    },
    timestamp: function() {
      var time = (new Date(this.timestamp)).toDateString();
      return time.substr(0, time.length - 4);    
    },
    postOptions : function() {
      return {
        collection: "posts",
        field: "title",
        removeEmpty: true,
        acceptEmpty: true,
        placeholder: "Post title",
        substitute: '<i class="fa fa-pencil"></i>'
      }
    },
    selected : function (type) {
      return Session.equals('editor', type);    
    }
  });
  
  Template.posts.events({
    'click button.froala, click button.default' : function () {
      Session.set('editor', (Session.equals('editor', 'default')) ? 'froala' : 'default');    
    }
  });
  
}

if (Meteor.isServer) {
  var destroy = function() {
    Posts.remove({});
    Comments.remove({});
    tx.Transactions.remove({});
    Posts.insert({_id: "abc123", timestamp: Date.now(), title: "Editable post title - delete this title to remove the post", body: '<div>This is the body of the post, written with the <strong>wysiwyg editor</strong>. It is editable because we wrote {{&gt; editableText collection="posts" field="body" wysiwyg=true}} in the template instead of {{body}}.<br></div><div><br></div><div>This demo app was written with meteor packages (<a href="https://github.com/aldeed/meteor-collection2" target="_blank">aldeed:collection2</a>, <a href="https://github.com/JackAdams/meteor-transactions" target="_blank">babrahams:transactions</a>, <a href="https://github.com/ianmartorell/meteor-accounts-ui-bootstrap-3" target="_blank">ian:accounts-ui-bootstrap-3</a>, <a href="https://github.com/meteorhacks/fast-render/" target="_blank">meteorhacks:fast-render</a>, <a href="https://github.com/JackAdams/meteor-editable-text-wysiwyg-bootstrap-3" target="_blank">babrahams:editable-text-wysiwyg-bootstrap-3</a>, <a href="https://github.com/JackAdams/meteor-editable-list" target="_blank">babrahams:editable-list</a>) and a minimal amount of code (<a href="https://github.com/JackAdams/editable-text-demo/blob/master/editable-text-demo.html" target="_blank">html</a>, <a href="https://github.com/JackAdams/editable-text-demo/blob/master/editable-text-demo.js" target="_blank">js</a>, <a href="https://github.com/JackAdams/editable-text-demo/blob/master/editable-text-demo.css" target="_blank">css</a>). It demonstrates some of the uses of the <a href="https://github.com/JackAdams/meteor-editable-text">babrahams:editable-text</a> package.</div><div><br></div><div>See the source at <a href="https://github.com/JackAdams/editable-text-demo">https://github.com/JackAdams/editable-text-demo.</a></div>', tags: ['Drag to reorder', 'Click to edit']});
    Comments.insert({post_id:  "abc123", timestamp:Date.now(), text: "To remove a comment, delete the text and press 'Enter'. This is possible because we wrote {{> editableText collection=\"comments\" field=\"text\" textarea=true removeEmpty=true}} instead of {{text}} in the template.", user: "example@example.com"});
    Comments.insert({post_id: "abc123", timestamp:Date.now(), text: "Sign in with - email: demo@demo.com, password: password - for email addresses in posts and comments."});
    Comments.insert({post_id: "abc123", timestamp:Date.now(), text: "All posts will self destruct every 15 minutes."});
    if (!Meteor.users.findOne({emails: {$elemMatch: {address: "demo@demo.com"}}})) {
      Accounts.createUser({username: "demo-user", email: "demo@demo.com", password: "password"});
    }
    Meteor.setTimeout(function() {
      destroy();
    }, 15 * 60 * 1000);
  }
  destroy();
}