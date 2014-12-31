Posts = new Mongo.Collection('posts');
Comments = new Mongo.Collection('comments');

Schemas = {};

Schemas.Post = new SimpleSchema({
  title: {
	type: String,
	label: "Title",
	max: 200,
	optional:true
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
    }
});

Posts.attachSchema(Schemas.Post);
Comments.attachSchema(Schemas.Comment);
Meteor.users.attachSchema(Schemas.User);

addTimestampToDoc = function(doc) {
  var extraFields = {timestamp:Date.now()};
  if (Meteor.user() && this.collection === 'posts') {
	extraFields.user = Meteor.user().emails[0].address;
  }
  return _.extend(doc,extraFields);
}

if (Meteor.isClient) {

  Tracker.autorun(function() {
	EditableText.useTransactions = (Meteor.user()) ? true : false;
  });
  
  tx.undoRedoButtonClass = 'btn btn-default undo-redo';

  Template.posts.helpers({
    posts: function() {
      return Posts.find({deleted:{$exists:false}},{sort:{timestamp:-1}});
    },
	comments: function() {
	  return Comments.find({post_id:this._id,deleted:{$exists:false}},{sort:{timestamp:1}});
	},
	newCommentDoc: function() {
	  return {};  
	},
	timestamp: function() {
	  return (new Date(this.timestamp)).toUTCString();	
	}
  });
  
}

if (Meteor.isServer) {
  var destroy = function() {
	Posts.remove({});
	Comments.remove({});
	tx.Transactions.remove({});
	Posts.insert({_id:"abc123",timestamp:Date.now(),title:"Editable post title - delete this title to remove the post",body:'This is the body of the post, written with the <strong>wysiwyg editor</strong>.  It is editable because we wrote {{> editableText collection="posts" field="body" wysiwyg=true}} in the template instead of {{body}}.<br /><br />This demo app was written with meteor packages (aldeed:collection2, babrahams:transactions, ian:accounts-ui-bootstrap-3, meteorhacks:fast-render, babrahams:editable-text-wysiwyg-bootstrap-3) and 166 lines of code (<a href="https://github.com/JackAdams/editable-text-example/blob/master/editable-text-example.html" target="_blank">html: 39 loc</a>, <a href="https://github.com/JackAdams/editable-text-example/blob/master/editable-text-example.js" target="_blank">js: 91 loc</a>, <a href="https://github.com/JackAdams/editable-text-example/blob/master/editable-text-example.css" target="_blank">css: 36 loc</a>). It demonstrates some of the uses of the <a href="https://github.com/JackAdams/meteor-editable-text">babrahams:editable-text</a> package.<br /><br />See the source at <a href="https://github.com/JackAdams/editable-text-demo">https://github.com/JackAdams/editable-text-demo.</a>'});
	Comments.insert({post_id:"abc123",timestamp:Date.now(),text:"To remove a comment, delete the text and press 'Enter'. This is possible because we wrote {{> editableText collection=\"comments\" field=\"text\" textarea=true removeEmpty=true}} instead of {{text}} in the template."});
	Comments.insert({post_id:"abc123",timestamp:Date.now(),text:"Sign in with - email:demo@demo.com, password:password - to see the undo/redo stack in action."});
	Comments.insert({post_id:"abc123",timestamp:Date.now(),text:"All posts will self destruct every 15 minutes."});
	Meteor.setTimeout(function() {
	  destroy();
    },15 * 60 * 1000);
  }
  destroy();
}