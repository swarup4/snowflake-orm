# snowflake-orm


# Documentation for SnowFlake ORM

## DQL

### Find

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
        LIKE: ['fname', 'A%']
    }
}
```

##### NOT LIKE
```javascript
operator: {
    NOTLIKE: ['fname', 'A%']
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
```
```javascript
		//Need to be
			IN: {
				filed: 'age',
				value: [24, 26, 28]
      			}
```

```javascript
		NOT IN
			operator: {
				NOTIN: ['age', 24, 26, 28]
                    	}
```
```javascript
		GREATER THEN
			operator: {
                        		GT: ['age', 25]
                    	}
```
```javascript
		GREATER THEN OR EQUAL
			operator: {
                        		GTE: ['age', 25]
                    	}
```
```javascript
		LESS THEN
			operator: {
                        		LT: ['age', 27]
                    	}
```
```javascript
		LESS THEN OR EQUAL
			operator: {
                        		LTE: ['age', 27]
                    	}
```

Order By
```javascript
		Model.find({
			order: {
				field: ‘column’,
				orderBy: ‘DESC	// For Descending order DESC & for Ascending Order ASC. Default is Ascending order
			}
		}).then(res => {
			res.send(res);
		});




	7. Distinct
		Model.find({
			column: [column1, column2, column3],
			distinct: true,
			where: {}
		}).then(res => {
			res.send(res);
		}).catch(err => {
			res.send(err);
		});




	8. Limit & Offset
		Model.find({
			limit: [4, 1]	// 1st Parameter for Limit & 2nd Parameter for Offset
		}).then(res => {
			res.send(res);
		});


		Only LIMIT
			Model.find({
				limit: 4		//or
				limit: [4]
			}).then(res => {
				res.send(res);
			});


	9. Function
		Count()
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


		Avg()
			functions: {
				name: ‘AVG’,
				option: [{
					column: ‘column1’,
					as: ‘Average’,
					distinct: false
				}]
			}


		Max()
			functions: {
				name: ‘MAX’,
				option: [{
					column: ‘column1’,
					as: ‘maximum’,
					distinct: true
				}]
			}


		Min()
			functions: {
				name: ‘MIN’,
				option: [{
					column: ‘column1’,
					as: ‘minimum’,
					distinct: false
				}]
			}


		Sum()
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




DDL
	1. Data Type
		BINARY => "BINARY",
    		BOOLEAN => "BOOLEAN",


		NUMBER
			NUMBER(length),
			INT(length),
			INTEGER(length),
			FLOAT,
			DOUBLE,


		Text
			STRING(length),
			VARCHAR(length),
			CHAR(length),


		Date Time
			DATE,
			DATETIME,
			TIMESTAMP(),		// (), (LTZ) & (NTZ)
	    		NOW()


	2. Model Example
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
				defaultValue: 1			// Default Value = 1
			},
			createdAt: {
				type: SnowflakeOrm.TIMESTAMP('LTZ'),
				defaultValue: SnowflakeOrm.NOW()		// Default Value = Current Time
			}
		});


		const userDetails = new ORM("userdetails", {
			id: {
				type: SnowflakeOrm.INT(),
				primaryKey: true,			// Primary Key
				autoIncrement: true		// Auto Increment
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




	3. CRUD
		Insert
			Model.save(req.body).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


		Update
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


		UpdateByID
			Model.updateById(req.body, id).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


		Delete
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


		DeleteByID
			Model.deleteById(id).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


Raw Query 
	const Query = require('../snowflake-orm’).query;
	// With Params
	let sql = "SELECT * FROM USER WHERE FNAME = ?";
	Query(sql, [“Swarup"]).then(data => {
		res.send(data);
	}).catch(err => {
		console.log(err);
	});


	// Without Params
	let sql = "SELECT * FROM USER";
	Query(sql).then(data => {
		res.send(data);
	}).catch(err => {
		console.log(err);
	});


Joining 
	1. Inner Join


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


	2. Right Join
    		Model.rightJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});


	3. Left Join
    		Model.leftJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});


	4. Full Join
		Model.fullJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});




SubQuery 
	1. Condition
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
		});2. Column List  (With All Column)
		Model.find({
			column: []
		}).then(res => {
			res.send(res);
		});


	3. Column List  (With Specific Column)
		column: [column1, column2, column3]


	4. Where Clause  (With Equal)
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


	5. Where Clause  (With Operator)
		LIKE
			where: {
                    		operator: {
                        			LIKE: ['fname', 'A%']
                    		}
                		}


		NOT LIKE
			operator: {
                        		NOTLIKE: ['fname', 'A%']
                    	}


		BETWEEN
			operator: {
		         	BETWEEN: ['age', 25, 28]
        			}


		NOT BETWEEN
			operator: {
				NOTBETWEEN: ['age', 25, 28]
                    	}


		IN
			operator: {
				IN: ['age', 24, 26, 28]
			}


		//Need to be
			IN: {
				filed: 'age',
				value: [24, 26, 28]
      			}


function whereClause(param1,result) {
  startpoint = end = 0
  string = '('
  
  while(end < result.length){
  end = startpoint + 16000
  str = result.slice(startpoint,end).join('\',\'')
  string = string.concat( " "+param1 +" in ('"+str+"') or \n")
  startpoint = end}
  
  string = string.slice(0,-4)
  string = string.concat(')')
  return string
}






		NOT IN
			operator: {
				NOTIN: ['age', 24, 26, 28]
                    	}


		GREATER THEN
			operator: {
                        		GT: ['age', 25]
                    	}


		GREATER THEN OR EQUAL
			operator: {
                        		GTE: ['age', 25]
                    	}


		LESS THEN
			operator: {
                        		LT: ['age', 27]
                    	}


		LESS THEN OR EQUAL
			operator: {
                        		LTE: ['age', 27]
                    	}




	6. Order By
		Model.find({
			order: {
				field: ‘column’,
				orderBy: ‘DESC	// For Descending order DESC & for Ascending Order ASC. Default is Ascending order
			}
		}).then(res => {
			res.send(res);
		});




	7. Distinct
		Model.find({
			column: [column1, column2, column3],
			distinct: true,
			where: {}
		}).then(res => {
			res.send(res);
		}).catch(err => {
			res.send(err);
		});




	8. Limit & Offset
		Model.find({
			limit: [4, 1]	// 1st Parameter for Limit & 2nd Parameter for Offset
		}).then(res => {
			res.send(res);
		});


		Only LIMIT
			Model.find({
				limit: 4		//or
				limit: [4]
			}).then(res => {
				res.send(res);
			});


	9. Function
		Count()
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


		Avg()
			functions: {
				name: ‘AVG’,
				option: [{
					column: ‘column1’,
					as: ‘Average’,
					distinct: false
				}]
			}


		Max()
			functions: {
				name: ‘MAX’,
				option: [{
					column: ‘column1’,
					as: ‘maximum’,
					distinct: true
				}]
			}


		Min()
			functions: {
				name: ‘MIN’,
				option: [{
					column: ‘column1’,
					as: ‘minimum’,
					distinct: false
				}]
			}


		Sum()
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




DDL
	1. Data Type
		BINARY => "BINARY",
    		BOOLEAN => "BOOLEAN",


		NUMBER
			NUMBER(length),
			INT(length),
			INTEGER(length),
			FLOAT,
			DOUBLE,


		Text
			STRING(length),
			VARCHAR(length),
			CHAR(length),


		Date Time
			DATE,
			DATETIME,
			TIMESTAMP(),		// (), (LTZ) & (NTZ)
	    		NOW()


	2. Model Example
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
				defaultValue: 1			// Default Value = 1
			},
			createdAt: {
				type: SnowflakeOrm.TIMESTAMP('LTZ'),
				defaultValue: SnowflakeOrm.NOW()		// Default Value = Current Time
			}
		});


		const userDetails = new ORM("userdetails", {
			id: {
				type: SnowflakeOrm.INT(),
				primaryKey: true,			// Primary Key
				autoIncrement: true		// Auto Increment
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




	3. CRUD
		Insert
			Model.save(req.body).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


		Update
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


		UpdateByID
			Model.updateById(req.body, id).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


		Delete
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


		DeleteByID
			Model.deleteById(id).then(res => {
				res.send(res);
			}).catch(err => {
				res.send(err);
			});


Raw Query 
	const Query = require('../snowflake-orm’).query;
	// With Params
	let sql = "SELECT * FROM USER WHERE FNAME = ?";
	Query(sql, [“Swarup"]).then(data => {
		res.send(data);
	}).catch(err => {
		console.log(err);
	});


	// Without Params
	let sql = "SELECT * FROM USER";
	Query(sql).then(data => {
		res.send(data);
	}).catch(err => {
		console.log(err);
	});


Joining 
	1. Inner Join


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


	2. Right Join
    		Model.rightJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});


	3. Left Join
    		Model.leftJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});


	4. Full Join
		Model.fullJoin(obj).then(data => {
			res.send(data);
		}).catch(err => {
			console.log(err);
		});




SubQuery 
	1. Condition
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
