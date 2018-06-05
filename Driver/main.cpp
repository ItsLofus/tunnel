#include "../../src/sio_client.h"

#include <functional>
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <string>

#ifdef WIN32
#define HIGHLIGHT(__O__) std::cout<<__O__<<std::endl
#define EM(__O__) std::cout<<__O__<<std::endl

#include <stdio.h>
#include <tchar.h>
#define MAIN_FUNC int _tmain(int argc, _TCHAR* argv[])
#else
#define HIGHLIGHT(__O__) std::cout<<"\e[1;31m"<<__O__<<"\e[0m"<<std::endl
#define EM(__O__) std::cout<<"\e[1;30;1m"<<__O__<<"\e[0m"<<std::endl

#define MAIN_FUNC int main(int argc ,const char* args[])
#endif

int participants = -1;

using namespace sio;
using namespace std;
std::mutex _lock;

std::condition_variable_any _cond;
bool connect_finish = false;

class connection_listener
{
    sio::client &handler;

public:
    
    connection_listener(sio::client& h):
    handler(h)
    {
    }
    

    void on_connected()
    {
        _lock.lock();
        _cond.notify_all();
        connect_finish = true;
        _lock.unlock();
    }
    void on_close(client::close_reason const& reason)
    {
        std::cout<<"sio closed "<<std::endl;
        exit(0);
    }
    
    void on_fail()
    {
        std::cout<<"sio failed "<<std::endl;
        exit(0);
    }
};

// Keeps track of data pertaining to this instance of the driver
struct c_me {
	string UserID;
	string DriverID;
};

c_me *me;
socket::ptr current_socket;

void bind_events(socket::ptr &socket)
{
	current_socket->on("Command", sio::socket::event_listener_aux([&](string const& name, message::ptr const& data, bool isAck,message::list &ack_resp)
    {
        _lock.lock();
        
        // So likely get_map() is going to be in a weird form
        // Log it out to check what's going on
		string user = data->get_map()["UserID"]->get_string();
        
		if (user == me->UserID) {
			string Command = data->get_map()["CMD_Name"]->get_string();

			// Okay now react to the inputted command
		}


        _lock.unlock();
    }));    
}

void populateDriverInfo(c_me *nme) {
	// Read the registry for this driver ID. Kind of a pain, use an ini
	nme->DriverID = "xxxx";

	// Check if the userID is on file else, retrieve it from the server
		// Is this safe? Maybe a login system would be better
	nme->UserID = "xxxx"
}

MAIN_FUNC
{
Local_Init:
	me = new c_me;
    sio::client h;
    connection_listener l(h);
    
    h.set_open_listener(std::bind(&connection_listener::on_connected, &l));
    h.set_close_listener(std::bind(&connection_listener::on_close, &l,std::placeholders::_1));
    h.set_fail_listener(std::bind(&connection_listener::on_fail, &l));
    h.connect("http://127.0.0.1:3000");
    _lock.lock();
    if(!connect_finish)
    {
        _cond.wait(_lock);
    }
    _lock.unlock();
	current_socket = h.socket();
	
	

Server_Init:
	// Gather the nessercary info
	populateDriverInfo(&me);
    current_socket->emit("RegisterDriver", me);

Bind_Events:
	// Start listening for commands
    bind_events(current_socket);
    
Close:
    // Clear it up and quit
    HIGHLIGHT("Closing...");
    h.sync_close();
    h.clear_con_listeners();
	return 0;
}

