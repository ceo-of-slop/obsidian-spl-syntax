// SPL Commands - Comprehensive list from Splunk documentation
export const SPL_COMMANDS = new Set([
  // Transforming Commands
  'stats', 'chart', 'timechart', 'top', 'rare', 'contingency', 'highlight',
  'addtotals', 'addcoltotals', 'bin', 'bucket', 'eventstats', 'streamstats',
  'geostats', 'mstats', 'sichart', 'sitimechart', 'tstats', 'xyseries', 'untable',

  // Generating Commands
  'search', 'inputlookup', 'inputcsv', 'makeresults', 'metadata', 'rest',
  'datamodel', 'pivot', 'loadjob', 'savedsearch', 'gentimes', 'dbinspect',

  // Streaming Commands
  'eval', 'rex', 'rename', 'fields', 'table', 'where', 'regex', 'replace',
  'convert', 'fillnull', 'makemv', 'mvexpand', 'nomv', 'split', 'strcat',
  'dedup', 'head', 'tail', 'sort', 'reverse', 'uniq', 'spath', 'xmlkv',

  // Reporting Commands
  'transaction', 'cluster', 'kmeans', 'anomalies', 'predict', 'trendline',
  'associate', 'correlate', 'analyzefields', 'anomalousvalue',

  // Subsearch/Macro Commands
  'append', 'appendcols', 'appendpipe', 'join', 'lookup', 'outputlookup',
  'map', 'foreach', 'return', 'format', 'multisearch',

  // Data Management Commands
  'collect', 'delete', 'sendemail', 'outputcsv', 'outputtext',

  // Additional Commands
  'abstract', 'accum', 'addinfo', 'arules', 'audit', 'autoregress',
  'bucketdir', 'cefout', 'cofilter', 'concurrency', 'crawl', 'dbxquery',
  'diff', 'erex', 'eventcount', 'eventtypes', 'extract', 'fieldformat',
  'fieldsummary', 'file', 'filldown', 'findtypes', 'folderize', 'gauge',
  'geom', 'getfield', 'history', 'iconify', 'inputintelligence',
  'iplocation', 'kv', 'kvform', 'localize', 'localop', 'makecontinuous',
  'mcollect', 'meventcollect', 'mpreview', 'msearch', 'multikv',
  'mvcombine', 'mvjoin', 'overlap', 'outputtelemetry', 'outlier',
  'rangemap', 'redistribute', 'reltime', 'require', 'rtorder', 'run',
  'runshellscript', 'savedsearches', 'scrub', 'searchtxn', 'selfjoin',
  'sendalert', 'set', 'setfields', 'sistats', 'sperf', 'srctype',
  'strptime', 'tags', 'teragrep', 'timewrap', 'tojson', 'transpose',
  'trendline', 'tscollect', 'typeahead', 'typelearner', 'typer', 'union',
  'walklex', 'x11', 'xmlunescape', 'xpath', 'xsDisplayConcept',
  'xsDisplayContext', 'xsFindBestConcept', 'xsListConcepts',
  'xsListContexts', 'xsUpdateDDContext', 'xsWhere',
]);

// SPL Functions - Eval and Statistical functions
export const SPL_FUNCTIONS = new Set([
  // Comparison and Conditional Functions
  'case', 'cidrmatch', 'coalesce', 'false', 'if', 'ifnull', 'in', 'like',
  'lookup', 'match', 'null', 'nullif', 'searchmatch', 'true', 'validate',

  // Conversion Functions
  'ipmask', 'printf', 'tonumber', 'tostring',

  // Cryptographic Functions
  'md5', 'sha1', 'sha256', 'sha512',

  // Date and Time Functions
  'now', 'relative_time', 'strftime', 'strptime', 'time',

  // Informational Functions
  'isbool', 'isint', 'isnotnull', 'isnull', 'isnum', 'isstr', 'typeof',

  // JSON Functions
  'json_object', 'json_array', 'json_extract', 'json_keys', 'json_set',
  'json_valid', 'json_append', 'json_extend', 'json_extract_exact',

  // Mathematical Functions
  'abs', 'ceiling', 'ceil', 'exact', 'exp', 'floor', 'ln', 'log', 'pi',
  'pow', 'round', 'sigfig', 'sqrt', 'sum',

  // Multivalue Functions
  'commands', 'mvappend', 'mvcount', 'mvdedup', 'mvfilter', 'mvfind',
  'mvindex', 'mvjoin', 'mvmap', 'mvrange', 'mvsort', 'mvzip',

  // Statistical Functions (for stats, eventstats, streamstats, etc.)
  'avg', 'count', 'dc', 'distinct_count', 'distinctcount', 'earliest',
  'earliest_time', 'estdc', 'estdc_error', 'first', 'last', 'latest',
  'latest_time', 'list', 'max', 'mean', 'median', 'min', 'mode',
  'p', 'perc', 'percentile', 'range', 'rate', 'stdev', 'stdevp',
  'sumsq', 'values', 'var', 'varp',

  // Text Functions
  'len', 'lenght', 'lower', 'ltrim', 'replace', 'rtrim', 'spath',
  'split', 'substr', 'trim', 'upper', 'urldecode', 'urlencode',

  // Trigonometry and Hyperbolic Functions
  'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
  'cos', 'cosh', 'hypot', 'sin', 'sinh', 'tan', 'tanh',

  // Other Functions
  'random', 'relative_time', 'spath', 'xpath',
]);

// SPL Keywords and Boolean Operators
export const SPL_KEYWORDS = new Set([
  // Boolean Operators
  'and', 'or', 'not', 'xor',

  // Clause Keywords
  'as', 'by', 'over', 'where', 'output', 'outputnew', 'from', 'to',
  'with', 'into', 'on', 'using', 'having', 'groupby', 'orderby',

  // Boolean Values
  'true', 'false', 'null',

  // Time Keywords
  'earliest', 'latest', 'starttime', 'endtime',

  // Special Keywords
  'allnum', 'delim', 'keepevents', 'consecutive', 'maxspan', 'maxpause',
  'startswith', 'endswith', 'mvlist', 'usenull', 'useother', 'otherstr',
  'limit', 'showcount', 'showperc', 'countfield', 'percentfield',
  'dc', 'partitions', 'allnum', 'default', 'timeformat', 'cont',
  'span', 'bins', 'minspan', 'start', 'end', 'aligntime',
]);

// Datamodel and CIM field names (commonly used)
export const SPL_DATAMODEL_FIELDS = new Set([
  // Endpoint Processes
  'processes.image', 'processes.commandline', 'processes.parentimage',
  'processes.parentcommandline', 'processes.user', 'processes.dest',
  'processes.process_id', 'processes.parent_process_id',

  // Network Traffic
  'all_traffic.src', 'all_traffic.dest', 'all_traffic.src_port',
  'all_traffic.dest_port', 'all_traffic.bytes', 'all_traffic.packets',

  // Authentication
  'authentication.user', 'authentication.src', 'authentication.dest',
  'authentication.action', 'authentication.app',

  // Common fields
  '_time', '_raw', '_indextime', 'host', 'source', 'sourcetype', 'index',
  'eventtype', 'linecount', 'punct', 'splunk_server', 'timeendpos',
  'timestartpos',
]);
