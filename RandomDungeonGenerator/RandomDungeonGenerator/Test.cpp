#include <iostream>
#include "DungeonBuilder.h"
int mapSize = 25;

void run(DungeonBuilder builder)
{
	std::cout << "Building";
	builder.generateRoom();
	builder.generateRoom();
	builder.generateRoom();
	builder.generateRoom();
	builder.generateRoom();
	builder.generateRoom();
	builder.replaceHalls();
	std::cout << "\nDONE!\n";
	builder.print();
	builder.clear(mapSize, mapSize);
	std::cout << "\nRun Again? (0 = quit): ";
}

int main(void)
{
	DungeonBuilder builder(mapSize, mapSize);
	char x = '1';

	while (x != '0'){
		run(builder);
		std::cin >> x;
	}
}