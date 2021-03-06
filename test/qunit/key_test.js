steal("src/synthetic.js", function(Syn){
module("synthetic/key",{
	setup: function() {
		st.g("qunit-test-area").innerHTML = "<form id='outer'>"+
			"<div id='inner'>"+
				"<input type='input' id='key' value=''/>"+
				"<a href='#abc' id='focusLink'>click me</a>"+
				"<textarea id='synTextArea'></textarea>"+
				"<div id='editable' contenteditable='true'></div>" +
				"</div></form>";
	},

	teardown: function() {		st.g("qunit-test-area").innerHTML = '';
	}
})
test("Key Characters", function(){
	st.g("key").value = "";
	Syn.key("a","key");
	equal(st.g("key").value, "a", "a written");
	
	st.g("key").value = "";
	Syn.key("A","key");
	equal(st.g("key").value, "A", "A written");
	
	st.g("key").value = "";
	Syn.key("1","key");
	equal(st.g("key").value, "1", "1 written");
});


test("Key \\r Submits Forms", 2, function(){
	var submit = 0, 
		change = 0;
	st.binder("key","change",function(ev){
		change++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		ev.returnValue = false;
		return false;
	});
	st.binder("outer","submit",function(ev){
		submit++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		ev.returnValue = false;
		return false;
	});
	stop()
	Syn.key("\r","key", function(){
		equal(submit, 1, "submit on keypress");
		equal(change, 1, "submit on keypress");
		start();
	})
})

test("Key \\r Clicks Links", 1, function(){
	var clicked = 0;
	st.binder("focusLink","click",function(ev){
		clicked++;
		if ( ev.preventDefault ) {
			ev.preventDefault();
		}
		ev.returnValue = false;
		return false;
	});
	stop()
	Syn.key("\r","focusLink", function(){
		equal(clicked, 1, "clicked");
		start();
	})
});

test("Key Event Order", 1, function(){
	var order = [],
		recorder = function(ev){
			order.push(ev.type)
		};
	
	st.binder("key","keydown", recorder );
	st.binder("key","keypress", recorder );
	st.binder("key","input", recorder );
	st.binder("key","keyup", recorder );
	stop();
	Syn.key("B","key", function(){
		var expected = ["keydown", "keypress", "keyup"];
		if(Syn.support.oninput) {
			expected.splice(2, 0, "input");
		}

		deepEqual(order, expected, "Key order is correct");
		start();
	});
	
})

test("Key \\r Adds Newline in Textarea", function(){
	st.g('synTextArea').value = "";
	stop()
	Syn.type("ab\rcd","synTextArea", function(){
		equal(  st.g('synTextArea').value.replace("\r","")  , "ab\ncd" ,"typed new line correctly")
		start();
	})
});

test("Key \\b", function(){
	st.g("key").value = "";
	stop();
	Syn.type("abc","key", function(){
		equal(st.g("key").value, "abc", "abc written");
		Syn.key("\b","key");
		equal(st.g("key").value, "ab", "ab written (key deleted)");
		start();
	});
})


//tests when the key is inserted
test("Key Character Order", function(){
	
	var upVal,
		pressVal,
		downVal
	st.binder("key","keyup",function(){
		upVal = st.g("key").value
	} );
	st.binder("key","keypress",function(){
		pressVal = st.g("key").value
		
	} );
	st.binder("key","keydown",function(){
		downVal = st.g("key").value
	} );
	stop();
	Syn.key("J","key", function(){
		equal(upVal, "J" , "Up Typing works")
		equal(pressVal, "" , "Press Typing works")
		equal(downVal, "" , "Down Typing works");
		start();
	})

})

test("page down, page up, home, end", function(){
	st.g("qunit-test-area").innerHTML = 
		"<div id='scrolldiv' style='width:100px;height:200px;overflow-y:scroll;' tabindex='0'>"+
		"<div id='innerdiv' style='height:1000px;'><a href='javascript://'>Scroll on me</a></div></div>";
	
	//reset the scroll top	
	st.g("scrolldiv").scrollTop =0;
	
	//list of keys to press and what to test after the scroll event
	var keyTest = {
		"page-down": function() {
			ok( st.g("scrolldiv").scrollTop > 10 , "Moved down")
		},
		"page-up": function() {
			ok( st.g("scrolldiv").scrollTop === 0 , "Moved back up (page-up)")
		},
		"end" : function() {
			var sd = st.g("scrolldiv")
			ok( sd.scrollTop == sd.scrollHeight - sd.clientHeight , "Moved to the end")
		},
		"home" : function() {
			ok( st.g("scrolldiv").scrollTop === 0 , "Moved back up (home)")
		}
	},
	order = [],
	i = 0,
	runNext = function(){
		var name = order[i];
		if(!name){
			start();
			return;
		}
		Syn.key( name, "scrolldiv")
	};
	for(var name in keyTest){
		if (keyTest.hasOwnProperty(name)) { 
			order.push(name)
		}
	}
			
	st.bind(st.g("scrolldiv"),"scroll",function(ev){
		keyTest[order[i]]()
		i++;
		setTimeout(runNext,1)

	} );
	stop();

	st.g("scrolldiv").focus();
	runNext();

})
test("range tests", function(){
	var selectText = function(el, start, end){
		if(el.setSelectionRange){
			if(!end){
                el.focus();
                el.setSelectionRange(start, start);
			} else {
				el.selectionStart = start;
				el.selectionEnd = end;
			}
		}else if (el.createTextRange) {
			//el.focus();
			var r = el.createTextRange();
			r.moveStart('character', start);
			end = end || start;
			r.moveEnd('character', end - el.value.length);
			
			r.select();
		} 
	}
	st.g("qunit-test-area").innerHTML = "<form id='outer'><div id='inner'><input type='input' id='key' value=''/></div></form>"+
		"<textarea id='mytextarea' />";
	
	var keyEl = st.g("key")
	var textAreaEl = st.g("mytextarea")
	
	// test delete range
	keyEl.value = "012345";
	selectText(keyEl, 1, 3);
	
	Syn.key("delete","key")
	
	equal(keyEl.value, "0345", "delete range works");
	
	// test delete key
	keyEl.value = "012345";
	selectText(keyEl, 2);

	Syn.key("delete","key");
	equal(keyEl.value, "01345", "delete works");


	// test character range
	keyEl.value = "123456";
	selectText(keyEl, 1, 3);

	
	Syn.key("a","key");
	equal(keyEl.value, "1a456", "character range works");

	// test character key
	keyEl.value = "123456";
	selectText(keyEl, 2);
	
	Syn.key("a","key");
	equal(keyEl.value, "12a3456", "character insertion works");

	// test backspace range
	keyEl.value = "123456";
	selectText(keyEl, 1, 3);
	Syn.key("\b","key");
	equal(keyEl.value, "1456", "backspace range works");
	
	// test backspace key
	keyEl.value = "123456";
	selectText(keyEl, 2);
	Syn.key("\b","key");
	equal(keyEl.value, "13456", "backspace works");
	
	// test textarea ranges
	textAreaEl.value = "123456";
	selectText(textAreaEl, 1, 3);
	
	Syn.key("delete",textAreaEl);
	equal(textAreaEl.value, "1456", "delete range works in a textarea");

	// test textarea ranges
	textAreaEl.value = "123456";
	selectText(textAreaEl, 1, 3);
	Syn.key("a",textAreaEl);
	equal(textAreaEl.value, "1a456", "character range works in a textarea");
	
	// test textarea ranges
	textAreaEl.value = "123456";
	selectText(textAreaEl, 1, 3);
	Syn.key("\b",textAreaEl);
	equal(textAreaEl.value, "1456", "backspace range works in a textarea");
	
	// test textarea ranges
	textAreaEl.value = "123456";
	selectText(textAreaEl, 1, 3);
	Syn.key("\r",textAreaEl);
	
	equal(textAreaEl.value.replace("\r",""), "1\n456", "return range works in a textarea");
	
    //st.g("qunit-test-area").innerHTML = "";
	
})

test("Type with tabs", function(){
	st.g("qunit-test-area").innerHTML =
		 	"<input tabindex='3' id='third'/>" +
			"<a tabindex='1' id='first' href='javascript://'>First</a>"+
			"<input tabindex='2' id='second'/>"+
			"<input tabindex='4' id='fourth'/>"
	st.g('first').focus();
	
	var clicked = 0;
	st.binder('first', 'click', function(){
		clicked++;
	})
	stop();
	//give ie a second to focus
	setTimeout(function(){
		Syn.type('\r\tSecond\tThird\tFourth', 'first', function(){
			equal(clicked,1,"clickd first");
			equal(st.g('second').value,"Second","moved to second");
			equal(st.g('third').value,"Third","moved to Third");
			equal(st.g('fourth').value,"Fourth","moved to Fourth");
			start();
		})
	},1)
});

test("Type with shift tabs", function(){
	st.g("qunit-test-area").innerHTML =
		 	"<input tabindex='3' id='third'/>" +
			"<a tabindex='1' id='first' href='javascript://'>First</a>"+
			"<input tabindex='2' id='second'/>"+
			"<input tabindex='4' id='fourth'/>"
	st.g('first').focus();
	
	var clicked = 0;
	st.binder('first', 'click', function(){
		clicked++;
	})
	stop();
	//give ie a second to focus
	setTimeout(function(){
		Syn.type('[shift]4\t3\t2\t\r[shift-up]', 'fourth', function(){
			equal(clicked,1,"clickd first");
			equal(st.g('second').value,"2","moved to second");
			equal(st.g('third').value,"3","moved to Third");
			equal(st.g('fourth').value,"4","moved to Fourth");
			start();
		})
	},1)
});


test("Type left and right", function(){
	stop()
	Syn.type("012345678[left][left][left]\b",'key', function(){
		equal( st.g('key').value, "01234678", "left works" );
		
		
			Syn.type("[right][right]a",'key', function(){
				equal( st.g('key').value, "0123467a8", "right works" );
				start();
			})

	})

	
});
test("Type left and delete", function(){
	stop()
	Syn.type("123[left][delete]",'key', function(){
		equal( st.g('key').value, "12", "left delete works" );
		start();
	})
	
});
test("Typing Shift", function(){
	stop()

	
	var shift = false;
	st.binder('key','keypress', function(ev){
		shift = ev.shiftKey
	})
	Syn.type("[shift]A[shift-up]",'key',function(){
		ok(shift,"Shift key on")
		start();
	})
})
test("Typing Shift then clicking", function(){
	stop()

	var shift = false;
	st.binder('inner','click', function(ev){
		shift = ev.shiftKey
	})
	Syn.type("[shift]A",'key')
		.click({},'inner')
		.type("[shift-up]",'key', function(){
			ok(shift,"Shift key on click")
			start();
		})
})


test("Typing Shift Left and Right", function(){
	stop()

	Syn.type("012345678[shift][left][left][left][shift-up]\b[left]\b",'key', function(){
		equal( st.g('key').value, "01235", "shift left works" );

		
		

		Syn.type("[left][left][shift][right][right]\b[shift-up]",'key', function(){
			
			equal( st.g('key').value, "015", "shift right works" );
			start();
		})

	})
})

test("shift characters", function(){
	stop()
	Syn.type("@", 'key' , function(){
		equal( st.g('key').value, "@", "@ character works" );
		start();
	})
});

test("number key codes", 2, function(){
	stop()
	
	st.binder("key","keydown",function(ev){
		ok(ev.keyCode === 40,"key codes are numbers" )
		ok(ev.which === ev.keyCode, "which is normalized")
		start();
	} );
	
	Syn.type("[down]", 'key' , function(){
	});
})

test("Key codes of like-keys", function(){
	stop();

	var keys = {
		"subtract": 109,
		"dash": 189,
		"divide": 111,
		"forward-slash": 191,
		"decimal": 110,
		"period": 190
	};

	var cnt = 0;
	var done = function(){
		cnt++;
		if(cnt === 6) {
			start();
		}
	};

	var testKeyCode = function(key, code){
		st.binder("key", "keydown", function f(ev){
			st.unbinder("key", "keydown", f);
			ok(ev.keyCode === code);
			ok(ev.which === ev.keyCode);
			done();
		});
		Syn.type("[" + key + "]", "key");
	};

	for(var key in keys) {
		testKeyCode(key, keys[key]);
	}
});

test("focus moves on keydown to another element", function(){
	stop();
	st.binder("key","keydown",function(ev){
		st.g('synTextArea').focus();

	});
	st.binder("synTextArea","keypress",function(ev){
		ok(true, "keypress called");
		start();
	});
	Syn.type("a", 'key' , function(){
	});
})

test("typing in a number works", function() {
  stop();
  Syn.type(9999, 'key', function() {
    equal( st.g('key').value, "9999", "typing in numbers works" );
    start();
  });
});

test("typing in a contenteditable works", function(){
	stop();
	Syn.type("hello world", "editable", function(){
		var editable = st.g("editable");
		var text = editable.textContent || editable.innerText;
		equal(text, "hello world", "Content editable was edited");
		start();
	});
});

});
