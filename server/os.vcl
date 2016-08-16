# new 4.0 format.
vcl 4.0;

# Default backend definition. Set this to point to your content server.
backend default {
    .host = "127.0.0.01";
    .port = "3000";
}

sub vcl_recv {
    # Happens before we check if we have this in cache already.
    #
    # Typically you clean up the request here, removing cookies you don't need,
    # rewriting the request, etc.
}

sub vcl_backend_response {
    if (beresp.http.Cache-Control ~ "(no-cache|private)" || beresp.http.Pragma ~ "no-cache")  {
        unset beresp.http.Expires;
        unset beresp.http.Cache-Control;
        unset beresp.http.Pragma;
              
        # Marker for vcl_deliver to reset Age: /
        set beresp.http.magicmarker = "1";

        # Leveraging browser, cache set the clients TTL on this object /
        set beresp.http.Cache-Control = "public, max-age=2592000";

        # cache set the clients TTL on this object /        
        set beresp.ttl = 30d;  

        # Allow stale content, in case the backend goes down.
        # make Varnish keep all objects for 6 hours beyond their TTL
        set beresp.grace = 6h;
        return (deliver);
     }
}

sub vcl_deliver {

    if (resp.http.magicmarker) {
        unset resp.http.magicmarker;
        # By definition we have a fresh object 
        #set resp.http.Age = "0";

    }

    if (obj.hits > 0) { 
        # Add debug header to see if it's a HIT/MISS and the number of hits, disable    when not needed
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }

    # Please note that obj.hits behaviour changed in 4.0, now it counts per objecthead, not per object
    # and obj.hits may not be reset in some cases where bans are in use. See bug 1492 for details.
    # So take hits with a grain of salt
    set resp.http.X-Cache-Hits = obj.hits;

    # Set Varnish server name
    set resp.http.X-Served-By = server.hostname;
    set resp.http.Contact = "zager.co";



    # Remove some headers: PHP version
    unset resp.http.X-Powered-By;


    # Force Cache
    unset resp.http.Accept-Ranges;
    unset resp.http.Accept-Ranges;
    unset resp.http.Age;
    unset resp.http.ETag;
    unset resp.http.Last-Modified;
    unset resp.http.Cache-Control;
    set resp.http.Cache-Control = "public, max-age=31536000";


    # Remove some headers: Apache version & OS
    unset resp.http.Server;
    unset resp.http.X-Varnish;
    unset resp.http.Via;
    unset resp.http.Link;
    unset resp.http.X-Generator;

    return (deliver);
}
