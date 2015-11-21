"use strict";

var filter = require('./filter');

if (typeof filter != 'function') {
    filter = filter.filter;
}

var assert = require('assert');
var utils = require('util');
var deepcopy = require('deepcopy');

function test(messages, rules, expected) {
    var result = filter(messages, rules);
    assert.notStrictEqual(result, undefined, 'Filter result is undefined');

    for (var msgName in messages) {
        var resMsg = result[msgName];
        var expMsg = expected[msgName];

        assert.deepEqual(resMsg, expMsg, utils.format('Error in %s. Expected: %s, actual: %s',
          msgName, JSON.stringify(expMsg), JSON.stringify(resMsg)));
    }

    return true;
}

function start_tests() {
    for (var testName in tests) {
        var t = deepcopy(tests[testName]);
        console.log('test "%s" started', testName);
        test(t.messages, t.rules, t.expected);
    }
    console.log('Tests done');
}

var tests = {
    test_default: {
        messages: {
            msg1: {from: 'jack@example.com', to: 'jill@example.org'},
            msg2: {from: 'noreply@spam.com', to: 'jill@example.org'},
            msg3: {from: 'boss@work.com', to: 'jack@example.com'}
        },
        rules: [
            {from: '*@work.com', action: 'tag work'},
            {from: '*@spam.com', action: 'tag spam'},
            {from: 'jack@example.com', to: 'jill@example.org', action: 'folder jack'},
            {to: 'jill@example.org', action: 'forward to jill@elsewhere.com'}
        ],
        expected: {
            msg1: ['folder jack', 'forward to jill@elsewhere.com'],
            msg2: ['tag spam', 'forward to jill@elsewhere.com'],
            msg3: ['tag work']
        }
    },

    test_default_2: {
        messages: {
            msg1: {from: 'jack@example.com', to: 'jill@example.org'},
            msg2: {from: 'noreply@spam.com', to: 'jill@example.org'},
            msg3: {from: 'boss@work.com', to: 'jack@example.com'}
        },
        rules: [
            {from: '*@work.com', action: 'tag work'},
            {from: '*@spam.com', action: 'tag spam'},
            {from: '*@spam.com', action: 'tag spam'},
            {from: '*@spam.com', action: 'tag spam'},
            {from: '*@spam.com', action: 'tag spam'},
            {from: 'jack@example.com', to: 'jill@example.org', action: 'folder jack'},
            {to: 'jill@example.org', action: 'forward to jill@elsewhere.com'}
        ],
        expected: {
            msg1: ['folder jack', 'forward to jill@elsewhere.com'],
            msg2: ['tag spam', 'tag spam', 'tag spam', 'tag spam', 'forward to jill@elsewhere.com'],
            msg3: ['tag work']
        }
    },

    test_1: {
        messages: {},
        rules: [
            {"from":"*@work.com","action":"tag work"},
            {"from":"*@spam.com","action":"tag spam"},
            {"from":"jack@example.com","to":"jill@example.org","action":"folder jack"},
            {"to":"jill@example.org","action":"forward to jill@elsewhere.com"}
        ],
        expected: {}
    },

    test_2: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [],
        expected: {"msg1":[],"msg2":[],"msg3":[]}
    },

    test_3: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [{"from":"*@work.com","action":"tag work"}],
        expected: {"msg1":[],"msg2":[],"msg3":["tag work"]}
    },

    test_4: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [{"from":"*?work.com","action":"tag work"}],
        expected: {"msg1":[],"msg2":[],"msg3":["tag work"]}
    },

    test_5: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [{"from":"*?wor?.co?","action":"tag work"}],
        expected: {"msg1":[],"msg2":[],"msg3":["tag work"]}
    },

    test_6: {
        messages: {
            msg1: {"from":"abaabaaba","to":"jill@example.org"},
            msg2: {"from":"aba","to":"jill@example.org"},
            msg3: {"from":"d;rflkght","to":"jack@example.com"}
        },
        rules: [{"from":"*a*b*","action":"tag"}],
        expected: {"msg1":["tag"],"msg2":["tag"],"msg3":[]}
    },

    test_7: {
        messages: {
            msg1: {"from":"abaabaaba","to":"jill@example.org"},
            msg2: {"from":"aba","to":"jill@example.org"},
            msg3: {"from":"d;rflkght","to":"jack@example.com"}
        },
        rules: [{"from":"*","action":"tag"}],
        expected: {"msg1":["tag"],"msg2":["tag"],"msg3":["tag"]}
    },

    test_8: {
        messages: {
            msg1: {"from":"abaabaaba","to":"jill@example.org"},
            msg2: {"from":"aba","to":"jill@example.org"},
            msg3: {"from":"d;rflkght","to":"jack@example.com"}
        },
        rules: [
            {"from":"abaabaab*","action":"tag1"},
            {"from":"abaabaaba*?","action":"tag2"},
            {"from":"abaabaab*?*","action":"tag3"}
        ],
        expected: {"msg1":["tag1","tag3"],"msg2":[],"msg3":[]}
    },

    test_9: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [
            {"from":"*","action":"tag1"},
            {"from":"**","action":"tag2"},
            {"from":"***","action":"tag3"},
            {"from":"*jack@example.com","action":"tag4"},
            {"from":"jack@example.com*","action":"tag5"},
            {"from":"**jack@**.com**","action":"tag6"},
            {"from":"**@**.c*m**","action":"tag7"}
        ],
        expected: {"msg1":["tag1","tag2","tag3","tag4","tag5","tag6","tag7"],"msg2":["tag1","tag2","tag3","tag7"],"msg3":["tag1","tag2","tag3","tag7"]}
    },

    test_10: {
        messages: {
            msg1: {"from":"jack@example.com","to":"jill@example.org"},
            msg2: {"from":"noreply@spam.com","to":"jill@example.org"},
            msg3: {"from":"boss@work.com","to":"jack@example.com"}
        },
        rules: [
            {"from":"?","action":"tag1"},
            {"from":"????????????????","action":"tag2"},
            {"from":"????@???????????","action":"tag3"},
            {"from":"????*???????????","action":"tag4"},
            {"from":"?*?","action":"tag5"},
            {"from":"*?*","action":"tag6"},
            {"from":"?*??**?","action":"tag6"},
            {"from":"?????????????????","action":"tag7"},
            {"from":"???????????????*?","action":"tag8"}
        ],
        expected: {"msg1":["tag2","tag3","tag4","tag5","tag6","tag6","tag8"],"msg2":["tag2","tag4","tag5","tag6","tag6","tag8"],"msg3":["tag5","tag6","tag6"]}
    },

    test_11: {
        messages: {"msg1":{"from":" @ ","to":" @ "}},
        rules: [{"from":"???","action":"tag sp"}],
        expected: {"msg1":["tag sp"]}
    },

    test_12: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"ok","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_13: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_14: {
        messages: {"msg1":{"from":"_ok","to":""}},
        rules: [{"from":"ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_15: {
        messages: {"msg1":{"from":"!ok","to":""}},
        rules: [{"from":"ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_16: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"ok*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_17: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"ok*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_18: {
        messages: {"msg1":{"from":"ok__","to":""}},
        rules: [{"from":"ok*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_19: {
        messages: {"msg1":{"from":"_ok","to":""}},
        rules: [{"from":"ok*","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_20: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"*ok","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_21: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"*ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_22: {
        messages: {"msg1":{"from":"_ok","to":""}},
        rules: [{"from":"*ok","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_23: {
        messages: {"msg1":{"from":"__ok","to":""}},
        rules: [{"from":"*ok","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_24: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_25: {
        messages: {"msg1":{"from":"2","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_26: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_27: {
        messages: {"msg1":{"from":"_12","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_28: {
        messages: {"msg1":{"from":"12_","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_29: {
        messages: {"msg1":{"from":"1_2","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_30: {
        messages: {"msg1":{"from":"1__2","to":""}},
        rules: [{"from":"1*2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_31: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_32: {
        messages: {"msg1":{"from":"2","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_33: {
        messages: {"msg1":{"from":"3","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_34: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_35: {
        messages: {"msg1":{"from":"23","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_36: {
        messages: {"msg1":{"from":"_123","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_37: {
        messages: {"msg1":{"from":"123_","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_38: {
        messages: {"msg1":{"from":"_123_","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_39: {
        messages: {"msg1":{"from":"1_23","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_40: {
        messages: {"msg1":{"from":"12_3","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_41: {
        messages: {"msg1":{"from":"1_2_3","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_42: {
        messages: {"msg1":{"from":"1__23","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_43: {
        messages: {"msg1":{"from":"1_2__3","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_44: {
        messages: {"msg1":{"from":"1__2__3","to":""}},
        rules: [{"from":"1*2*3","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_45: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"ok?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_46: {
        messages: {"msg1":{"from":"_ok","to":""}},
        rules: [{"from":"ok?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_47: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"ok?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_48: {
        messages: {"msg1":{"from":"ok__","to":""}},
        rules: [{"from":"ok?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_49: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"?ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_50: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"?ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_51: {
        messages: {"msg1":{"from":"_ok","to":""}},
        rules: [{"from":"?ok","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_52: {
        messages: {"msg1":{"from":"__ok","to":""}},
        rules: [{"from":"?ok","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_53: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"ok*?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_54: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"ok*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_55: {
        messages: {"msg1":{"from":"ok__","to":""}},
        rules: [{"from":"ok*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_56: {
        messages: {"msg1":{"from":"ok___","to":""}},
        rules: [{"from":"ok*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_57: {
        messages: {"msg1":{"from":"__ok","to":""}},
        rules: [{"from":"ok*?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_58: {
        messages: {"msg1":{"from":"ok","to":""}},
        rules: [{"from":"ok?*","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_59: {
        messages: {"msg1":{"from":"ok_","to":""}},
        rules: [{"from":"ok?*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_60: {
        messages: {"msg1":{"from":"ok__","to":""}},
        rules: [{"from":"ok?*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_61: {
        messages: {"msg1":{"from":"ok___","to":""}},
        rules: [{"from":"ok?*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_62: {
        messages: {"msg1":{"from":"__ok","to":""}},
        rules: [{"from":"ok?*","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_63: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_64: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_65: {
        messages: {"msg1":{"from":"_12","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_66: {
        messages: {"msg1":{"from":"12_","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_67: {
        messages: {"msg1":{"from":"1_2","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_68: {
        messages: {"msg1":{"from":"1__2","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_69: {
        messages: {"msg1":{"from":"_1_2","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_70: {
        messages: {"msg1":{"from":"1_2_","to":""}},
        rules: [{"from":"1?2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_71: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_72: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_73: {
        messages: {"msg1":{"from":"_12","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_74: {
        messages: {"msg1":{"from":"12_","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_75: {
        messages: {"msg1":{"from":"1_2","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_76: {
        messages: {"msg1":{"from":"1__2","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_77: {
        messages: {"msg1":{"from":"_1_2","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_78: {
        messages: {"msg1":{"from":"1_2_","to":""}},
        rules: [{"from":"1??2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_79: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_80: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_81: {
        messages: {"msg1":{"from":"123","to":""}},
        rules: [{"from":"*?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_82: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"*??","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_83: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"*??","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_84: {
        messages: {"msg1":{"from":"123","to":""}},
        rules: [{"from":"*??","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_85: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"*?*?***?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_86: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"*?*?***?","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_87: {
        messages: {"msg1":{"from":"123","to":""}},
        rules: [{"from":"*?*?***?","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_88: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"*1*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_89: {
        messages: {"msg1":{"from":"_1","to":""}},
        rules: [{"from":"*1*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_90: {
        messages: {"msg1":{"from":"1_","to":""}},
        rules: [{"from":"*1*","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_91: {
        messages: {"msg1":{"from":"2","to":""}},
        rules: [{"from":"*1*","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_92: {
        messages: {"msg1":{"from":"1","to":""}},
        rules: [{"from":"*1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_93: {
        messages: {"msg1":{"from":"_1","to":""}},
        rules: [{"from":"*1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_94: {
        messages: {"msg1":{"from":"12","to":""}},
        rules: [{"from":"*1*2","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_95: {
        messages: {"msg1":{"from":"2","to":""}},
        rules: [{"from":"*1*2","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_96: {
        messages: {"msg1":{"from":"(sender)","to":""}},
        rules: [{"from":"(sender)","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_97: {
        messages: {"msg1":{"from":"{sender}","to":""}},
        rules: [{"from":"{sender}","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_98: {
        messages: {"msg1":{"from":"[sender]","to":""}},
        rules: [{"from":"[sender]","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_99: {
        messages: {"msg1":{"from":"[sender]","to":""}},
        rules: [{"from":"[rednes]","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_100: {
        messages: {"msg1":{"from":"$ender","to":""}},
        rules: [{"from":"$ender","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_101: {
        messages: {"msg1":{"from":"^","to":""}},
        rules: [{"from":"^","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_102: {
        messages: {"msg1":{"from":"|","to":""}},
        rules: [{"from":"|","action":"ok"}],
        expected: {"msg1":["ok"]}
    },

    test_102: {
        messages: {"msg1":{"from":"ab","to":""}},
        rules: [{"from":"a|b","action":"ok"}],
        expected: {"msg1":[]}
    },

    test_103: {
        messages: {"msg1":{"from":"+","to":""}},
        rules: [{"from":"+","action":"ok"}],
        expected: {"msg1":["ok"]}
    },
};


start_tests();
