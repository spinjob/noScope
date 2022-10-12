var app = require('../src/app');
var port = process.env.PORT || 3001;

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
});