import codecs
try:
    with codecs.open('test_results.txt', 'r', 'utf-16le') as f:
        print(f.read())
except Exception as e:
    print(e)
