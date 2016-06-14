var context = require.context('./source/js', true, /-spec\.js$/);

context.keys().forEach(context);
//console.log(context.keys());
