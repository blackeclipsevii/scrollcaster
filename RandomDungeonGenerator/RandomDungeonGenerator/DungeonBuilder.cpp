#include "DungeonBuilder.h"
#include "TwoDVector.h"
#include <time.h>

TwoDVector<char> dungeon;
TwoDVector<char> room;
int lastCenter = -1;
int pass = 0;

void generateWalls(int width, int height)
{
	dungeon.fill('w', width, height);
	room.fill('O', 3, 3);
	room.replace(9 / 2, 'X');
}

void safetyReset()
{
	if (pass > dungeon.size())
	{
		std::cout << "FAILED";
		pass = 0;
		dungeon.clear();
		generateWalls(25, 25);
	}
	else
	{
		pass++;
	}
}

int getAbsolutePosition()
{
	int absolutePosition;
	int x, y;

	do{
		std::cout << ".";
		absolutePosition = rand() % dungeon.size();
		x = dungeon.getX(absolutePosition);
		y = dungeon.getY(absolutePosition);
	} while (x <= 1 || x > (dungeon.width() - 4)
		|| y <= 1 || absolutePosition > dungeon.size() - (3)*dungeon.width());

	std::cout << ".";
	return absolutePosition;
}

void generateHallway(int roomCenter)
{
	pass = 0;
	//int currentX = roomCenter % dungeon.width();
	//int currentY = roomCenter / dungeon.width();
	int oldX = lastCenter % dungeon.width() + 1;
	int oldY = lastCenter / dungeon.width();

	int it = roomCenter + 1;
	
	dungeon.replace(it, 'H');
	while (dungeon.getX(it) != oldX)
	{
		safetyReset();

		if (dungeon.getX(it) > oldX)
		{
			it--;
		}
		else
		{
			it++;
		}
		dungeon.replace(it, 'H');
	}

	while (dungeon.getY(it) != oldY)
	{
		safetyReset();

		if (dungeon.getY(it) > oldY)
		{
			it -= dungeon.width();
		}
		else
		{
			it += dungeon.width();
		}
		dungeon.replace(it, 'H');
	}

	pass = 0;
}

void DungeonBuilder::replaceHalls()
{
	for (int i = 0; i < dungeon.size(); i++)
	{
		if (dungeon.at(i) == 'H')
		{
			dungeon.replace(i, 'O');
		}
	}
}

void DungeonBuilder::generateRoom()
{
	//std::cout << ".";
	int absolutePosition;
	bool overlap;
	do{
		//there is no overlap, because we have not checked
		overlap = false;

		//get the new absolute position of the room being generated
		absolutePosition = getAbsolutePosition();

		//check using a nested for loop to treat it like a 2D vector
		for (int i = 0; i < room.width(); i++)
		{
			for (int j = 0; j < room.height(); j++){
				//the current character being checked
				char a = dungeon.at((absolutePosition + j + i*dungeon.width()));

				//check it against the acceptable characters
				//if the character is not accepted, an overlap has occured
				if (a != 'w' && a != 'H')
				{
					overlap = true;
				}
			}
		}

		//if an overlap occured restart the process to generate a new room and check
	} while (overlap);
	
	//since the process was successful the room must now be written to the dungeon
	int pos = 0;
	for (int i = 0; i < room.width(); i++)
	{
		for (int j = 0; j < room.height(); j++){	
			dungeon.replace((absolutePosition + j + i*dungeon.width()), room.at(pos));
			pos++;
		}
	}

	//if this is not the first room, we will generate a hallway to make sure the rooms are connected
	if (lastCenter > 0)
	{
		int center = absolutePosition + ((room.height() / 2) * dungeon.width());
		generateHallway(center);
	}
	
	//save the position of this room incase we need to make a hallway from a new room
	lastCenter = absolutePosition + ((room.height() / 2) * dungeon.width());
}

DungeonBuilder::DungeonBuilder(int width, int height)
{
	srand(time(NULL));
	generateWalls(width, height);
}

void DungeonBuilder::print()
{
	dungeon.print();
}

void  DungeonBuilder::clear(int w, int h)
{
	dungeon.clear();
	generateWalls(w, h);
}