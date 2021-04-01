# SNOWFLAKE-ORM

## Installation
```sh
$ npm i snowflake-orm

# And add the dependency:
$ npm i snowflake-sdk
```

## Documentation

### Connecting to Snowflake DB
For creating the connection you have to Write this bellow code 
```javascript
const snowflakeOrm = require('./snowflake-orm');

const dbConfig = {
    username: 'Your Username',
    password: 'Your Password',
    account: 'Your Account Name',
    warehouse: 'Your Warehouse Name',
    database: 'Your Database Name',
    schema: 'Your Schema Name',
    role: 'Your Role Name'
};
snowflakeOrm.connect(dbConfig);
```

### Data Type
##### NUMBER
```javascript
NUMBER(length),
INT(length),
INTEGER(length),
FLOAT,
DOUBLE,
```
##### Text
```javascript
STRING(length),
VARCHAR(length),
CHAR(length),
```
##### Date Time
```javascript
DATE,
DATETIME,
TIMESTAMP(),	// (), (LTZ) & (NTZ)
NOW()
```
##### OTHERS
```javascript
BINARY => "BINARY",
BOOLEAN => "BOOLEAN"
```

### Model Create Example
```javascript
const SnowflakeOrm = require('../snowflake-orm');
const Init = SnowflakeOrm.Init;
const user = new Init("user", {
    id: {
        type: SnowflakeOrm.INT(),
        primaryKey: true,			// Primary Key
        autoIncrement: true			// Auto Increment
    },
    fname: SnowflakeOrm.VARCHAR(50),
    lname: SnowflakeOrm.VARCHAR(50),
    username: {
        type: SnowflakeOrm.VARCHAR(70),
        unique: true,				// Unique Key
        allowNull: true				// Allow Null Value
    },
    email: SnowflakeOrm.VARCHAR(70),
    password: SnowflakeOrm.VARCHAR(50),
    age: SnowflakeOrm.INT(),
    status: {
        type: SnowflakeOrm.INT(1),
        defaultValue: 1			    // Default Value = 1
    },
    createdAt: {
        type: SnowflakeOrm.TIMESTAMP('LTZ'),
        defaultValue: SnowflakeOrm.NOW()	// Default Value = Current Time
    }
});


const userDetails = new ORM("userdetails", {
    id: {
        type: SnowflakeOrm.INT(),
        primaryKey: true,			// Primary Key
        autoIncrement: true		    // Auto Increment
    },
    userId: {
        type: SnowflakeOrm.INT(),
        allowNull: false,			// Do Not Allow Null Value
        references: {				// Foreign Key
            model: 'user', 			// 'user' refers to table name
            column: 'id', 			// 'id' refers to column name in user table
        }
    },
    phone: SnowflakeOrm.INT(),
    gender: SnowflakeOrm.VARCHAR(10)
});
```


### Fetch Data
Getting data from database.

#### Find All
```javascript
Model.find({}).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```


#### Column List  (With All Column)
```javascript
Model.find({
    column: []
}).then(res => {
    res.send(res);
});
```


#### Column List  (With Specific Column)
```javascript
Model.find({
    column: [column1, column2, column3]
}).then(res => {
    res.send(res);
});

```

#### Where Clause  (With Equal)
```javascript
Model.find({
    where: {
        condition: {
            ‘fname’: ‘Swarup’,
            ‘lname’: ‘Saha’,
        }
    }
}).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```


#### Where Clause  (With Operator)
##### LIKE
```javascript
where: {
    operator: {
        LIKE: [
            {
                filed: 'fname',
                value: 'A%'
            }
        ]
    }
}
```

##### NOT LIKE
```javascript
operator: {
    NOTLIKE: [
        {
            filed: 'fname',
            value: 'A%'
      	}
    ]
}
```

##### BETWEEN
```javascript
operator: {
    BETWEEN: ['age', 25, 28]
}
```
##### NOT BETWEEN
```javascript
operator: {
    NOTBETWEEN: ['age', 25, 28]
}
```
##### IN
```javascript
operator: {
    IN: ['age', 24, 26, 28]
}

//Or

operator: {
    IN: {
        filed: 'age',
        value: [24, 26, 28]
    }
}
```
##### NOT IN
```javascript
operator: {
    NOTIN: ['age', 24, 26, 28]
}

//Or

operator: {
    NOTIN: {
        filed: 'age',
        value: [24, 26, 28]
    }
}
```
##### GREATER THEN
```javascript
operator: {
    GT: ['age', 25]
}
```
##### GREATER THEN OR EQUAL
```javascript
operator: {
    GTE: ['age', 25]
}
```
##### LESS THEN
```javascript
operator: {
    LT: ['age', 27]
}
```
##### LESS THEN OR EQUAL
```javascript
operator: {
    LTE: ['age', 27]
}
```

##### Order By
```javascript
Model.find({
    order: {
        field: ‘column’,
        orderBy: ‘DESC	// For Descending order DESC & for Ascending Order ASC. Default is Ascending order
    }
}).then(res => {
    res.send(res);
});
```

#### Distinct
```javascript
Model.find({
    column: [column1, column2, column3],
    distinct: true,
    where: {}
}).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```



#### Limit & Offset
```javascript
Model.find({
    limit: [4, 1]	// 1st Parameter for Limit & 2nd Parameter for Offset
}).then(res => {
    res.send(res);
});
```
##### Only LIMIT
```javascript
Model.find({
    limit: 4
}).then(res => {
    res.send(res);
});
```


#### Function
##### Count()
```javascript
Model.findByFunction({
    functions: {
        name: ‘COUNT’,
        option: [{
            column: ‘column1’,
            as: ‘count’,
            distinct: true
        }]
    }
    where: {}		// Optional
}).then(res => {
    res.send(res);
});
```

##### Avg()
```javascript
functions: {
    name: ‘AVG’,
    option: [{
        column: ‘column1’,
        as: ‘Average’,
        distinct: false
    }]
}
```

##### Max()
```javascript
functions: {
    name: ‘MAX’,
    option: [{
        column: ‘column1’,
        as: ‘maximum’,
        distinct: true
    }]
}
```

##### Min()
```javascript
functions: {
    name: ‘MIN’,
    option: [{
        column: ‘column1’,
        as: ‘minimum’,
        distinct: false
    }]
}
```

##### Sum()
```javascript
functions: {
    name: ‘SUM’,
    option: [{
        column: ‘column1’,
        as: ‘sum1’,
        distinct: false
    }, {
        column: ‘column2’,
        as: ‘sum2’,
        distinct: false
    }]
}
```


### CRUD
#### Insert
```javascript
Model.save(req.body).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```

#### Update
```javascript
Model.update(req.body, {
    where: {
        condition: {
            ‘fname’: ‘Swarup’,
            ‘lname’: ‘Saha’,
        }
    }
}).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```

#### UpdateByID
```javascript
Model.updateById(req.body, id).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```

#### Delete
```javascript
Model.update({
    where: {
        condition: {
            ‘fname’: ‘Swarup’,
            ‘lname’: ‘Saha’,
        }
    }
}).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```

#### DeleteByID
```javascript
Model.deleteById(id).then(res => {
    res.send(res);
}).catch(err => {
    res.send(err);
});
```

#### Raw Query
```javascript
const Query = require('../snowflake-orm’).query;
```
##### With Params
```javascript
let sql = "SELECT * FROM USER WHERE FNAME = ?";
Query(sql, [“Swarup"]).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```
##### Without Params
```javascript
let sql = "SELECT * FROM USER";
Query(sql).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```

### Joining 
#### Inner Join
```javascript
let obj = {
    column: ['fname'],
    eqColumn: 'id',
    include: [{
        model: Model2,
        column: ['homeTown'],
        eqcolumn: 'userId'
    }, {
        model: Model3,
        column: ['image'],
        eqColumn: 'userId'
    }],
    where: {
        operator: {
            GT: ['age', 26]
        }
    }
}

Model.innerJoin(obj).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```

#### Right Join
```javascript
Model.rightJoin(obj).then(data => {
    res.send(data);
}).catch(err => {
	console.log(err);
});
```

#### Left Join
```javascript
Model.leftJoin(obj).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```

#### Full Join
```javascript
Model.fullJoin(obj).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```


### SubQuery 

#### Condition
```javascript
let obj = {
    column:  ['fname', 'lname'],
    where: {
        condition: {
            id: {
                subQuery: {
                    model: Model2,
                    column: ['userId'],
                    where: {
                        condition: {
                            image: 'Swarup Profile Pics.jpg'
                        }
                    }
                }
            }
        }
    }
}


Model.find(obj).then(data => {
    res.send(data);
}).catch(err => {
    console.log(err);
});
```
