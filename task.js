const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-2'
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'Book';
const booksPath = '/books';
const bookPath = '/book';

exports.handler = async function (event) {
      //  return buildResponse(200, event.queryStringParameters +"###############event================")

       let response;
        switch (true) {
            case event.httpMethod === 'GET' && event.path === bookPath:
                response = await getBook(event.queryStringParameters.bookId);
                break;
            case event.httpMethod === 'GET' && event.path === booksPath:
                response = await getBooks();
                break;
            case event.httpMethod === 'POST' && event.path === bookPath:
                response = await addBook(JSON.parse(event.body));
                break;
            case event.httpMethod === 'PATCH' && event.path === bookPath:
                var requestBody=JSON.parse(event.body);
                response = await updateBook(requestBody.bookId,requestBody.updateKey,requestBody.updateValue);
                break;
            case event.httpMethod === 'DELETE' && event.path === bookPath:
                response = await deleteBook(event.queryStringParameters.bookId);
                break;
            default:
                response = buildResponse(404, '404 Not Found');
        }
        return response;
}

async function getBook(bookId) {
  if(bookId == null || bookId <= 0){
     // console.log("===============#################BOOK++++++++++++++++ID")
    return buildResponse(400, "Invalid  bookId");
  }
     const params = {
        TableName: dynamodbTableName,
        Key: {
            'book_id': bookId
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
       // console.log(response,"============ITEM BOOK+++++++++++")
      return buildResponse(200,response);
    }, (error) => {
      console.error("Unable to get item. Error JSON:", JSON.stringify(error, null, 2));
       return buildResponse(error.statusCode, JSON.stringify(error, null, 2));
    });
  }
  

async function getBooks() {
    const params = {
        TableName: dynamodbTableName
    }
    console.log(params)
    const allBooks = await scanDynamoRecords(params, []);
   // console.log(allBooks,"================allBooks===================")
    return buildResponse(200, allBooks);
}

async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey) {
            scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch (error) {
        console.error(" Unable to get items Error JSON:", JSON.stringify(error, null, 2));
         return buildResponse(error.statusCode, JSON.stringify(error, null, 2));
    }
}

async function addBook(requestBody) {
    if(requestBody==null || requestBody=="")
     return buildResponse(400, "invalid  requestBody");
   // console.log(requestBody,"====requestBody====")
    const params = {
        TableName: dynamodbTableName,
       Item: requestBody
    };
    console.log(params,"========PARAMS=======")
    return await dynamodb.put(params).promise().then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: requestBody
        };
        return buildResponse(200, body);
    }, (error) => {
        console.error("Unable to add item. Error JSON:", JSON.stringify(error, null, 2));
        return buildResponse(error.statusCode, JSON.stringify(error, null, 2));
    });
}

async function updateBook(bookId,updateKey,updateValue) {
  //  console.log("===============#################updateBook++++++++++++++++ID",obj)
 if(bookId == null || bookId <= 0){
     // console.log("===============#################BOOK++++++++++++++++ID")
    return buildResponse(400,"Invalid  bookId");
  }
   if(updateKey === null || updateKey === ""){
     // console.log("===============#################BOOK++++++++++++++++ID")
    return buildResponse(400, "Invalid  updateKey");
  }
    if(updateValue === null || updateValue === ""){
     // console.log("===============#################BOOK++++++++++++++++ID")
    return buildResponse(400, "Invalid  updateValue");
  }
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'book_id': bookId
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
            ':value': updateValue
        },
        ReturnValues: 'UPDATED_NEW'
    }
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'UPDATE',
            Message: 'SUCCESS',
            UpdatedAttributes: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error("Unable to update item. Error JSON:", JSON.stringify(error, null, 2));
        return buildResponse(error.statusCode, JSON.stringify(error, null, 2));
    })
}

async function deleteBook(bookId) {
     if(bookId == null || bookId <= 0){
     // console.log("===============#################BOOK++++++++++++++++ID")
    return buildResponse(400,"Invalid  bookId");
  }
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'book_id': bookId
        },
        ReturnValues: 'ALL_OLD'
    }
    return await dynamodb.delete(params).promise().then((response) => {
        const body = {
            Operation: 'DELETE',
            Message: 'SUCCESS',
            Item: response
        }
        return buildResponse(200,body);
    }, (error) => {
        console.error('Unable to delete item. Error JSON:', JSON.stringify(error, null, 2));
        return buildResponse(error.statusCode, JSON.stringify(error, null, 2));

    })
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
}