{
  "targets": [
    {
      "target_name": "R",
      "sources": [ "src/rl.cpp",
                   "src/rlink.cpp"],
      "variables": {
              'R_HOME%' : '<!(R RHOME)',
              'RCPPFLAGS%' : '<!(<(R_HOME%)/bin/R CMD config --cppflags | sed "s/^...//")',
              'RLDFLAGS%' : '<!(<(R_HOME%)/bin/R CMD config --ldflags)',
              'RBLAS%' : '<!(<(R_HOME%)/bin/R CMD config BLAS_LIBS)',
              'RLAPACK%' : '<!(<(R_HOME%)/bin/R CMD config LAPACK_LIBS)',
              'RINSIDEINCL%' : '<!(echo "RInside:::CxxFlags()" | <(R_HOME%)/bin/R --vanilla --slave | sed "s/^...//")',
              'RINSIDELIBS%' : '<!(echo "RInside:::LdFlags()" | <(R_HOME%)/bin/R --vanilla --slave)',
              'RCPPINCL%' : '<!(echo "Rcpp:::CxxFlags()" | <(R_HOME%)/bin/R --vanilla --slave | sed "s/^...//")',
              'RCPPLIBS%' : '<!(echo "Rcpp:::LdFlags()" | <(R_HOME%)/bin/R --vanilla --slave)',
              },
      "link_settings":
            {
              'ldflags': ['<(RLDFLAGS)'],
              'libraries': ['<(RLDFLAGS)',
                            '<(RINSIDELIBS)',
                            '<(RCPPLIBS)',
                            '<(RBLAS)',
                            '<(RLAPACK)',
                            ]
            },
          'include_dirs': [
              "<!(node -e \"require('nan')\")",
              '/<(RINSIDEINCL)',
              '/<(RCPPINCL)',
              '/<(RCPPFLAGS)',
                          ],

          'cflags_cc!': ['-fno-rtti','-fno-exceptions'],
          'cflags_cc+': ['-frtti','-fno-exceptions'],
          'conditions': [
            ['OS=="mac"', {
              'xcode_settings': {
                "MACOSX_DEPLOYMENT_TARGET": "10.7",
                "OTHER_CPLUSPLUSFLAGS": [
                  "-stdlib=libc++"
                ],
                'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                'GCC_ENABLE_CPP_RTTI': 'YES'
              }
            }]
          ]
          }
  ]
}
