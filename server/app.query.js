var exec = function(db, collection, query){
    return new Promise( ( resolve, reject ) => {
        db.db.collection(collection, function (err, collection) {
            // Limits
            var limit = null
            if (query.$limit) {
                limit = query.$limit;
                delete query.$limit;
            }

            // Skip
            var skip = null;
            if (query.$skip) {
                skip = query.$skip;
                delete query.$skip;
            }

            // Fields
            var fields = {
                //_id: 0
            }; // Omit Mongo IDs
            if (query.$fields) {
                query.$fields.forEach(function (field) {
                    this[field] = 1;
                }, fields);
                delete query.$fields;
            } else if (query.$fields_exclude) {
                query.$fields_exclude.forEach(function (field) {
                    this[field] = 0;
                }, fields);
                delete query.$fields_exclude;
            }

            // Execute
            var find = collection.find(query, fields);
            if (limit) find = find.limit(limit);
            if (skip) find = find.skip(skip);
         
            find.toArray(function (err, results) {
                resolve(results);
            });
        });
    });
}

module.exports = {
    exec: exec
}
