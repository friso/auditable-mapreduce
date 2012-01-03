var UUID = require('../../nodejs/uuid/uuid')

exports.uuidShouldbeUnique = function(test){
    test.expect(1);
    var uuid1 = UUID.generate();
    var uuid2 = UUID.generate();
    test.notEqual(uuid1, uuid2, "uuid's should be unique");
    test.done();
};

exports.uuidStringRepresentationShouldMatchTheURI = function(test){
    test.expect(1);
    var uri = "23457af6-34df-67ae-3234-465ae67fe4cb"
    var uuid = UUID.parse("urn:uuid:"+uri);
    test.equal(uuid.toString(), uri, "uuid's string representation and uri should be equal");
    test.done();
};


