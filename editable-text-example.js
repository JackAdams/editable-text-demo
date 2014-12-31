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